import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, Patch, Post, Param, Query, Req, Res, Injectable, Inject,
  Module, UseGuards, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException,
  BadRequestException, ConflictException, NotFoundException, ServiceUnavailableException, HttpException } from '@nestjs/common';
import { db, columns } from './db';
import { bodyObject, field, emailAddress, validatePassword, passwordHash, checkPassword,
  hashToken, newToken, sameOrigin, cookie, setSessionCookies, publicUser } from './security';

@Injectable()
export class Accounts {
  async limit(key: string, maximum = 15, seconds = 900) {
    const result = await db.query(`INSERT INTO auth_limits(key,attempts,expires_at) VALUES($1,1,now()+$2*interval '1 second')
      ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.attempts+1 END,
      expires_at=CASE WHEN auth_limits.expires_at<now() THEN excluded.expires_at ELSE auth_limits.expires_at END RETURNING attempts`,
      [hashToken(key), seconds]);
    if (result.rows[0].attempts > maximum) throw new HttpException('Too many attempts. Try again later.', 429);
  }
  async session(request: any) {
    const token = cookie(request, 'ff_session');
    if (!/^[a-f0-9]{64}$/.test(token)) throw new UnauthorizedException('Please sign in');
    const result = await db.query(`SELECT u.*,s.csrf_hash FROM app_sessions s JOIN app_users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status<>'disabled'`, [hashToken(token)]);
    if (!result.rows[0]) throw new UnauthorizedException('Session expired. Please sign in');
    return result.rows[0];
  }
  async issue(userId: string, response: any, request: any) {
    const token = newToken(), csrf = newToken();
    await db.query('DELETE FROM app_sessions WHERE token_hash=$1 OR expires_at<now()', [hashToken(cookie(request,'ff_session'))]);
    await db.query(`INSERT INTO app_sessions(token_hash,user_id,csrf_hash,expires_at) VALUES($1,$2,$3,now()+interval '7 days')`,
      [hashToken(token), userId, hashToken(csrf)]);
    setSessionCookies(response, token, csrf);
  }
  async csrf(request: any, user: any) {
    sameOrigin(request);
    const token = request.headers['x-csrf-token'];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || hashToken(token) !== user.csrf_hash)
      throw new ForbiddenException('Invalid session token. Refresh the page');
  }
  ip(request: any) {
    return process.env.URL?.startsWith('https://') ? String(request.headers['x-nf-client-connection-ip'] || 'unknown') : request.socket.remoteAddress;
  }
  async mail(user: any, purpose: 'verify' | 'reset') {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.WEB_ORIGIN)
      throw new ServiceUnavailableException('Email delivery has not been configured. Contact the site administrator.');
    const token = newToken();
    await db.query(`INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')`,
      [hashToken(token), user.id, purpose]);
    const link = `${process.env.WEB_ORIGIN}/auth.html?${purpose}=${token}`;
    const response = await fetch('https://api.resend.com/emails', {method:'POST',
      headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.EMAIL_FROM,to:[user.email],
        subject:purpose === 'verify' ? 'Verify your Find Doctor Dubai email' : 'Reset your Find Doctor Dubai password',
        text:`${purpose === 'verify' ? 'Verify your email' : 'Reset your password'} using this link within 30 minutes:\n${link}\nIf you did not request this, ignore this email.`}),
      signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new ServiceUnavailableException('Unable to send email. Please try again later.');
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(Accounts) private accounts: Accounts) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.account = await this.accounts.session(request);
    if (!['GET','HEAD'].includes(request.method)) await this.accounts.csrf(request, request.account);
    context.switchToHttp().getResponse().setHeader('Cache-Control','no-store');
    return true;
  }
}
@Injectable()
class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest().account?.role !== 'admin') throw new ForbiddenException('Administrator access required');
    return true;
  }
}
@Controller('auth')
class AuthController {
  constructor(@Inject(Accounts) private accounts: Accounts) {}
  @Post('register') async register(@Body() input: unknown, @Req() request: any, @Res({passthrough:true}) response: any) {
    sameOrigin(request);
    const body = bodyObject(input), email = emailAddress(body.email), name = field(body.name,120,true);
    const password = validatePassword(body.password), role = body.role || 'patient';
    if (!['patient','doctor','clinic','hospital'].includes(role)) throw new BadRequestException('Invalid registration role');
    await this.accounts.limit('register:' + this.accounts.ip(request),20,3600);
    const id = randomUUID();
    let user;
    try {
      const result = await db.query(`INSERT INTO app_users(id,email,password_hash,name,phone,role,status)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [id,email,await passwordHash(password),name,field(body.phone || '',40),role,role === 'patient' ? 'active' : 'pending']);
      user = result.rows[0];
    } catch (error) {
      if ((error as any).code === '23505') throw new ConflictException('Unable to register this email. Try signing in or resetting your password.');
      throw error;
    }
    await this.accounts.issue(id,response,request);
    response.setHeader('Cache-Control','no-store');
    return {success:true,user:publicUser(user)};
  }
  @Post('login') async login(@Body() input: unknown, @Req() request: any, @Res({passthrough:true}) response: any) {
    sameOrigin(request);
    const body = bodyObject(input), email = emailAddress(body.email);
    if (typeof body.password !== 'string' || !body.password.length || body.password.length > 128) throw new BadRequestException('Invalid password');
    const password = body.password;
    await this.accounts.limit('login-ip:' + this.accounts.ip(request),60,900);
    await this.accounts.limit('login-email:' + email,15,900);
    const result = await db.query('SELECT * FROM app_users WHERE email=$1',[email]);
    const user = result.rows[0];
    if (!await checkPassword(password,user?.password_hash) || user.status === 'disabled')
      throw new UnauthorizedException('Invalid email or password');
    await this.accounts.issue(user.id,response,request);
    response.setHeader('Cache-Control','no-store');
    return {success:true,user:publicUser(user)};
  }
  @Get('me') @UseGuards(SessionGuard) me(@Req() request: any) { return {user:publicUser(request.account)}; }
  @Post('logout') @UseGuards(SessionGuard) async logout(@Req() request: any, @Res({passthrough:true}) response: any) {
    await db.query('DELETE FROM app_sessions WHERE token_hash=$1',[hashToken(cookie(request,'ff_session'))]);
    setSessionCookies(response,'','',true);
    return {success:true};
  }
  @Post('password') @UseGuards(SessionGuard) async password(@Body() input: unknown, @Req() request: any,
    @Res({passthrough:true}) response: any) {
    const body = bodyObject(input), next = validatePassword(body.password);
    await this.accounts.limit('password:' + request.account.id);
    if (typeof body.currentPassword !== 'string' || body.currentPassword.length > 128 || !await checkPassword(body.currentPassword,request.account.password_hash))
      throw new UnauthorizedException('Current password is incorrect');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2',[await passwordHash(next),request.account.id]);
      await client.query('DELETE FROM app_sessions WHERE user_id=$1',[request.account.id]);
      await client.query('DELETE FROM account_tokens WHERE user_id=$1',[request.account.id]);
      await client.query('COMMIT');
    } catch(error) { await client.query('ROLLBACK'); throw error; } finally {client.release();}
    await this.accounts.issue(request.account.id,response,request);
    return {success:true};
  }
  @Post('forgot') async forgot(@Body() input: unknown, @Req() request: any) {
    sameOrigin(request);
    const email = emailAddress(bodyObject(input).email);
    await this.accounts.limit('mail-ip:' + this.accounts.ip(request),10,3600);
    await this.accounts.limit('mail-email:' + email,3,3600);
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new ServiceUnavailableException('Password-reset email delivery is not configured yet.');
    const result = await db.query('SELECT id,email FROM app_users WHERE email=$1 AND status<>$2',[email,'disabled']);
    if (result.rows[0]) await this.accounts.mail(result.rows[0],'reset');
    return {success:true,message:'If an account exists, a reset link will be emailed.'};
  }
  @Post('verification') @UseGuards(SessionGuard) async verification(@Req() request: any) {
    await this.accounts.limit('verify:' + request.account.id,3,3600);
    if (!request.account.email_verified) await this.accounts.mail(request.account,'verify');
    return {success:true};
  }
  @Post('reset') async reset(@Body() input: unknown, @Req() request: any, @Res({passthrough:true}) response: any) {
    sameOrigin(request);
    const body = bodyObject(input), password = validatePassword(body.password), token = field(body.token,64,true);
    await this.accounts.limit('reset:' + this.accounts.ip(request),20,3600);
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING user_id`,[hashToken(token)]);
      if (!result.rows[0]) throw new BadRequestException('Reset link is invalid or expired');
      const id = result.rows[0].user_id;
      await client.query('UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2',[await passwordHash(password),id]);
      await client.query('DELETE FROM app_sessions WHERE user_id=$1',[id]);
      await client.query('DELETE FROM account_tokens WHERE user_id=$1',[id]);
      await client.query('COMMIT');
      setSessionCookies(response,'','',true);
      return {success:true};
    } catch(error) {await client.query('ROLLBACK'); throw error;} finally {client.release();}
  }
  @Post('verify') async verify(@Body() input: unknown, @Req() request: any) {
    sameOrigin(request);
    await this.accounts.limit('verify-token:' + this.accounts.ip(request),20,3600);
    const token = field(bodyObject(input).token,64,true), client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='verify' AND expires_at>now() RETURNING user_id`,[hashToken(token)]);
      if (!result.rows[0]) throw new BadRequestException('Verification link is invalid or expired');
      await client.query('UPDATE app_users SET email_verified=true WHERE id=$1',[result.rows[0].user_id]);
      await client.query('COMMIT');
      return {success:true};
    } catch(error) {await client.query('ROLLBACK'); throw error;} finally {client.release();}
  }
}

const profileKeys = ['specialty','facility','dhaLicense','area','address','bio','website'];
function profileFields(body: Record<string, any>) {
  const profile: Record<string,string> = {};
  for (const key of profileKeys) if (body[key] !== undefined) profile[key] = field(body[key],key === 'bio' ? 2000 : 250);
  if (profile.website) {
    try {if (!['https:','http:'].includes(new URL(profile.website).protocol)) throw new Error();}
    catch {throw new BadRequestException('Invalid website URL');}
  }
  return profile;
}
@Controller('account') @UseGuards(SessionGuard)
class ProfileController {
  @Get('profile') profile(@Req() request: any) {return {user:publicUser(request.account)};}
  @Patch('profile') async update(@Body() input: unknown, @Req() request: any) {
    const body = bodyObject(input);
    if (Object.keys(body).some(key => !['name','phone',...profileKeys].includes(key)))
      throw new BadRequestException('This field cannot be changed here');
    const result = await db.query(`UPDATE app_users SET name=COALESCE($1,name),phone=COALESCE($2,phone),
      profile=profile || $3::jsonb,updated_at=now() WHERE id=$4 RETURNING *`,
      [body.name === undefined ? null : field(body.name,120,true),body.phone === undefined ? null : field(body.phone,40),
        JSON.stringify(profileFields(body)),request.account.id]);
    return {success:true,user:publicUser(result.rows[0])};
  }
  @Get('providers') async providers(@Req() request: any) {
    const result = await db.query(`SELECT p.* FROM providers p JOIN provider_memberships m ON m.provider_id=p.id WHERE m.user_id=$1 ORDER BY p.name`,[request.account.id]);
    return {items:result.rows};
  }
  @Post('providers') async create(@Body() input: unknown, @Req() request: any) {
    if (!['doctor','clinic','hospital'].includes(request.account.role)) throw new ForbiddenException('Provider account required');
    const body = bodyObject(input), name = field(body.name,120,true), id = randomUUID();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE',[request.account.id]);
      const count = await client.query('SELECT count(*)::int AS count FROM provider_memberships WHERE user_id=$1',[request.account.id]);
      if (count.rows[0].count >= 10) throw new BadRequestException('Provider profile limit reached');
      const result = await client.query(`INSERT INTO providers(id,slug,name,kind,specialty,area,address,phone,website,published,verified)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,false,false) RETURNING *`,
        [id,name.toLowerCase().replace(/[^a-z0-9]+/g,'-') + '-' + id,name,
          request.account.role,field(body.specialty || '',200),field(body.area || '',100),
          field(body.address || '',250),field(body.phone || '',40),profileFields(body).website || '']);
      await client.query('INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2)',[id,request.account.id]);
      await client.query('COMMIT');
      return {success:true,provider:result.rows[0]};
    } catch(error) {await client.query('ROLLBACK'); throw error;} finally {client.release();}
  }
  @Patch('providers/:id') async updateProvider(@Param('id') id: string, @Body() input: unknown, @Req() request: any) {
    if (!['doctor','clinic','hospital','admin'].includes(request.account.role)) throw new ForbiddenException();
    const body = bodyObject(input), allowed = ['name','specialty','area','address','phone','website','services'];
    if (!Object.keys(body).length || Object.keys(body).some(key => !allowed.includes(key))) throw new BadRequestException('Invalid provider fields');
    const values: any[] = [], changes: string[] = [];
    for (const key of Object.keys(body)) {
      let value: any;
      if (key === 'services') {
        if (!Array.isArray(body.services) || body.services.length > 30) throw new BadRequestException('Invalid services');
        value = body.services.map((s: unknown) => field(s,100,true));
      } else value = key === 'website' ? profileFields(body).website : field(body[key],key === 'address' ? 250 : 200,key === 'name');
      values.push(value); changes.push(`${key}=$${values.length}`);
    }
    values.push(id,request.account.id,request.account.role);
    const result = await db.query(`UPDATE providers p SET ${changes.join(',')},verified=false,published=false,updated_at=now()
      WHERE p.id=$${values.length-2} AND ($${values.length}='admin' OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$${values.length-1})) RETURNING p.*`,values);
    if (!result.rows[0]) throw new NotFoundException('Provider profile not found');
    return {success:true,provider:result.rows[0]};
  }
}

@Controller('admin') @UseGuards(SessionGuard,AdminGuard)
class AdminController {
  @Get('users') async users(@Query('page') page = '1') {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1 || p > 10000) throw new BadRequestException();
    const result = await db.query(`SELECT id,email,name,phone,role,status,email_verified,profile,created_at FROM app_users ORDER BY created_at DESC LIMIT 50 OFFSET $1`,[(p-1)*50]);
    return {items:result.rows.map(publicUser),page:p};
  }
  @Patch('users/:id') async user(@Param('id') id: string, @Body() input: unknown, @Req() request: any) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    const body = bodyObject(input);
    if (Object.keys(body).some(k => !['role','status'].includes(k)) || !Object.keys(body).length) throw new BadRequestException();
    if (body.role && !['patient','doctor','clinic','hospital','admin'].includes(body.role)) throw new BadRequestException('Invalid role');
    if (body.status && !['active','pending','disabled'].includes(body.status)) throw new BadRequestException('Invalid status');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(826041)');
      const found = await client.query('SELECT * FROM app_users WHERE id=$1 FOR UPDATE',[id]);
      if (!found.rows[0]) throw new NotFoundException();
      if (body.role === 'admin' && !found.rows[0].email_verified) throw new BadRequestException('Verify this email before granting administrator access');
      if (found.rows[0].role === 'admin' && (body.role && body.role !== 'admin' || body.status && body.status !== 'active')) {
        const count = await client.query("SELECT count(*)::int AS count FROM app_users WHERE role='admin' AND status='active'");
        if (count.rows[0].count <= 1) throw new BadRequestException('Cannot remove the last active administrator');
      }
      const result = await client.query('UPDATE app_users SET role=COALESCE($1,role),status=COALESCE($2,status),updated_at=now() WHERE id=$3 RETURNING *',[body.role || null,body.status || null,id]);
      await client.query('DELETE FROM app_sessions WHERE user_id=$1',[id]);
      await client.query('INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)',[request.account.id,'user.permissions.updated',id]);
      await client.query('COMMIT');
      return {success:true,user:publicUser(result.rows[0])};
    } catch(error) {await client.query('ROLLBACK'); throw error;} finally {client.release();}
  }
  @Get('providers') async providers() {
    return {items:(await db.query('SELECT * FROM providers ORDER BY updated_at DESC LIMIT 200')).rows};
  }
  @Patch('providers/:id') async provider(@Param('id') id: string, @Body() input: unknown, @Req() request: any) {
    const body = bodyObject(input);
    if (Object.keys(body).some(k => !['published','verified','ownerId'].includes(k))) throw new BadRequestException();
    for (const key of ['published','verified']) if (body[key] !== undefined && typeof body[key] !== 'boolean') throw new BadRequestException();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const found = await client.query('SELECT id FROM providers WHERE id=$1 FOR UPDATE',[id]);
      if (!found.rows[0]) throw new NotFoundException();
      if (body.ownerId !== undefined) {
        if (typeof body.ownerId !== 'string' || !/^[a-f0-9-]{36}$/.test(body.ownerId)) throw new BadRequestException('Invalid owner');
        const owner = await client.query("SELECT id FROM app_users WHERE id=$1 AND role IN ('doctor','clinic','hospital') AND status='active'",[body.ownerId]);
        if (!owner.rows[0]) throw new BadRequestException('Assign an approved provider account');
        await client.query('DELETE FROM provider_memberships WHERE provider_id=$1',[id]);
        await client.query('INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2)',[id,body.ownerId]);
      }
      const result = await client.query(`UPDATE providers SET published=COALESCE($1,published),verified=COALESCE($2,verified),updated_at=now() WHERE id=$3 RETURNING *`,[body.published ?? null,body.verified ?? null,id]);
      await client.query('INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)',[request.account.id,'provider.updated',id]);
      await client.query('COMMIT');
      return {success:true,provider:result.rows[0]};
    } catch(error) {await client.query('ROLLBACK'); throw error;} finally {client.release();}
  }
  @Get('audit') async audit() {
    return {items:(await db.query('SELECT * FROM account_audit ORDER BY id DESC LIMIT 100')).rows};
  }
}
@Module({controllers:[AuthController,ProfileController,AdminController],providers:[Accounts,SessionGuard,AdminGuard]})
export class AccountsModule {}
