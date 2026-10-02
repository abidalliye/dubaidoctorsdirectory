import { randomUUID } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Req,
  Res,
  Injectable,
  Inject,
  Module,
  UseGuards,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
  HttpException,
} from "@nestjs/common";
import { db, columns } from "./db";
import {
  roles,
  providerKinds,
  profileSteps,
  listingFields,
  modules,
  settingFields,
} from "./dashboard-schema";
import {
  saveProfile,
  saveListing,
  listListings,
  validateFields,
  moduleFor,
  recordSave,
  archiveListing,
} from "./dashboard-data";
import {
  bodyObject,
  field,
  emailAddress,
  validatePassword,
  passwordHash,
  checkPassword,
  hashToken,
  newToken,
  sameOrigin,
  cookie,
  setSessionCookies,
  publicUser,
} from "./security";

@Injectable()
export class Accounts {
  async limit(key: string, maximum = 15, seconds = 900) {
    const result = await db.query(
      `INSERT INTO auth_limits(key,attempts,expires_at) VALUES($1,1,now()+$2*interval '1 second')
      ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_limits.expires_at<now() THEN 1 ELSE auth_limits.attempts+1 END,
      expires_at=CASE WHEN auth_limits.expires_at<now() THEN excluded.expires_at ELSE auth_limits.expires_at END RETURNING attempts`,
      [hashToken(key), seconds],
    );
    if (result.rows[0].attempts > maximum)
      throw new HttpException("Too many attempts. Try again later.", 429);
  }
  async session(request: any) {
    const token = cookie(request, "ff_session");
    if (!/^[a-f0-9]{64}$/.test(token))
      throw new UnauthorizedException("Please sign in");
    const result = await db.query(
      `SELECT u.*,s.csrf_hash FROM app_sessions s JOIN app_users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND u.status<>'disabled'`,
      [hashToken(token)],
    );
    if (!result.rows[0])
      throw new UnauthorizedException("Session expired. Please sign in");
    return result.rows[0];
  }
  async issue(userId: string, response: any, request: any) {
    const token = newToken(),
      csrf = newToken();
    await db.query(
      "DELETE FROM app_sessions WHERE token_hash=$1 OR expires_at<now()",
      [hashToken(cookie(request, "ff_session"))],
    );
    await db.query(
      `INSERT INTO app_sessions(token_hash,user_id,csrf_hash,expires_at) VALUES($1,$2,$3,now()+interval '7 days')`,
      [hashToken(token), userId, hashToken(csrf)],
    );
    setSessionCookies(response, token, csrf);
  }
  async csrf(request: any, user: any) {
    sameOrigin(request);
    const token = request.headers["x-csrf-token"];
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token) ||
      hashToken(token) !== user.csrf_hash
    )
      throw new ForbiddenException("Invalid session token. Refresh the page");
  }
  ip(request: any) {
    return process.env.URL?.startsWith("https://")
      ? String(request.headers["x-nf-client-connection-ip"] || "unknown")
      : request.socket.remoteAddress;
  }
  async mail(user: any, purpose: "verify" | "reset") {
    if (
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      !process.env.WEB_ORIGIN
    )
      throw new ServiceUnavailableException(
        "Email delivery has not been configured. Contact the site administrator.",
      );
    const token = newToken();
    await db.query(
      `INSERT INTO account_tokens(token_hash,user_id,purpose,expires_at) VALUES($1,$2,$3,now()+interval '30 minutes')`,
      [hashToken(token), user.id, purpose],
    );
    const link = `${process.env.WEB_ORIGIN}/auth.html?${purpose}=${token}`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [user.email],
        subject:
          purpose === "verify"
            ? "Verify your Find Doctor Dubai email"
            : "Reset your Find Doctor Dubai password",
        text: `${purpose === "verify" ? "Verify your email" : "Reset your password"} using this link within 30 minutes:\n${link}\nIf you did not request this, ignore this email.`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new ServiceUnavailableException(
        "Unable to send email. Please try again later.",
      );
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(Accounts) private accounts: Accounts) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.account = await this.accounts.session(request);
    if (!["GET", "HEAD"].includes(request.method))
      await this.accounts.csrf(request, request.account);
    context.switchToHttp().getResponse().setHeader("Cache-Control", "no-store");
    return true;
  }
}
@Injectable()
class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (context.switchToHttp().getRequest().account?.role !== "admin")
      throw new ForbiddenException("Administrator access required");
    return true;
  }
}
@Controller("auth")
class AuthController {
  constructor(@Inject(Accounts) private accounts: Accounts) {}
  @Post("register") async register(
    @Body() input: unknown,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    sameOrigin(request);
    const body = bodyObject(input),
      email = emailAddress(body.email),
      name = field(body.name, 120, true);
    const password = validatePassword(body.password),
      role = body.role || "patient";
    if (!roles.filter((r) => r !== "admin").includes(role))
      throw new BadRequestException("Invalid registration role");
    await this.accounts.limit(
      "register:" + this.accounts.ip(request),
      20,
      3600,
    );
    const id = randomUUID();
    let user;
    try {
      const result = await db.query(
        `INSERT INTO app_users(id,email,password_hash,name,phone,role,status)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [
          id,
          email,
          await passwordHash(password),
          name,
          field(body.phone || "", 40),
          role,
          role === "patient" ? "active" : "pending",
        ],
      );
      user = result.rows[0];
    } catch (error) {
      if ((error as any).code === "23505")
        throw new ConflictException(
          "Unable to register this email. Try signing in or resetting your password.",
        );
      throw error;
    }
    await this.accounts.issue(id, response, request);
    response.setHeader("Cache-Control", "no-store");
    return { success: true, user: publicUser(user) };
  }
  @Post("login") async login(
    @Body() input: unknown,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    sameOrigin(request);
    const body = bodyObject(input),
      email = emailAddress(body.email);
    if (
      typeof body.password !== "string" ||
      !body.password.length ||
      body.password.length > 128
    )
      throw new BadRequestException("Invalid password");
    const password = body.password;
    await this.accounts.limit("login-ip:" + this.accounts.ip(request), 60, 900);
    await this.accounts.limit("login-email:" + email, 15, 900);
    const result = await db.query("SELECT * FROM app_users WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    if (
      !(await checkPassword(password, user?.password_hash)) ||
      user.status === "disabled"
    )
      throw new UnauthorizedException("Invalid email or password");
    await this.accounts.issue(user.id, response, request);
    response.setHeader("Cache-Control", "no-store");
    return { success: true, user: publicUser(user) };
  }
  @Get("me") @UseGuards(SessionGuard) me(@Req() request: any) {
    return { user: publicUser(request.account) };
  }
  @Post("logout") @UseGuards(SessionGuard) async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    await db.query("DELETE FROM app_sessions WHERE token_hash=$1", [
      hashToken(cookie(request, "ff_session")),
    ]);
    setSessionCookies(response, "", "", true);
    return { success: true };
  }
  @Post("password") @UseGuards(SessionGuard) async password(
    @Body() input: unknown,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const body = bodyObject(input),
      next = validatePassword(body.password);
    await this.accounts.limit("password:" + request.account.id);
    if (
      typeof body.currentPassword !== "string" ||
      body.currentPassword.length > 128 ||
      !(await checkPassword(
        body.currentPassword,
        request.account.password_hash,
      ))
    )
      throw new UnauthorizedException("Current password is incorrect");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2",
        [await passwordHash(next), request.account.id],
      );
      await client.query("DELETE FROM app_sessions WHERE user_id=$1", [
        request.account.id,
      ]);
      await client.query("DELETE FROM account_tokens WHERE user_id=$1", [
        request.account.id,
      ]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    await this.accounts.issue(request.account.id, response, request);
    return { success: true };
  }
  @Post("forgot") async forgot(@Body() input: unknown, @Req() request: any) {
    sameOrigin(request);
    const email = emailAddress(bodyObject(input).email);
    await this.accounts.limit("mail-ip:" + this.accounts.ip(request), 10, 3600);
    await this.accounts.limit("mail-email:" + email, 3, 3600);
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
      throw new ServiceUnavailableException(
        "Password-reset email delivery is not configured yet.",
      );
    const result = await db.query(
      "SELECT id,email FROM app_users WHERE email=$1 AND status<>$2",
      [email, "disabled"],
    );
    if (result.rows[0]) await this.accounts.mail(result.rows[0], "reset");
    return {
      success: true,
      message: "If an account exists, a reset link will be emailed.",
    };
  }
  @Post("verification") @UseGuards(SessionGuard) async verification(
    @Req() request: any,
  ) {
    await this.accounts.limit("verify:" + request.account.id, 3, 3600);
    if (!request.account.email_verified)
      await this.accounts.mail(request.account, "verify");
    return { success: true };
  }
  @Post("reset") async reset(
    @Body() input: unknown,
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    sameOrigin(request);
    const body = bodyObject(input),
      password = validatePassword(body.password),
      token = field(body.token, 64, true);
    await this.accounts.limit("reset:" + this.accounts.ip(request), 20, 3600);
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='reset' AND expires_at>now() RETURNING user_id`,
        [hashToken(token)],
      );
      if (!result.rows[0])
        throw new BadRequestException("Reset link is invalid or expired");
      const id = result.rows[0].user_id;
      await client.query(
        "UPDATE app_users SET password_hash=$1,updated_at=now() WHERE id=$2",
        [await passwordHash(password), id],
      );
      await client.query("DELETE FROM app_sessions WHERE user_id=$1", [id]);
      await client.query("DELETE FROM account_tokens WHERE user_id=$1", [id]);
      await client.query("COMMIT");
      setSessionCookies(response, "", "", true);
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  @Post("verify") async verify(@Body() input: unknown, @Req() request: any) {
    sameOrigin(request);
    await this.accounts.limit(
      "verify-token:" + this.accounts.ip(request),
      20,
      3600,
    );
    const token = field(bodyObject(input).token, 64, true),
      client = await db.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `DELETE FROM account_tokens WHERE token_hash=$1 AND purpose='verify' AND expires_at>now() RETURNING user_id`,
        [hashToken(token)],
      );
      if (!result.rows[0])
        throw new BadRequestException(
          "Verification link is invalid or expired",
        );
      await client.query(
        "UPDATE app_users SET email_verified=true WHERE id=$1",
        [result.rows[0].user_id],
      );
      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

@Controller("account")
@UseGuards(SessionGuard)
class ProfileController {
  @Get("profile") profile(@Req() request: any) {
    return { user: publicUser(request.account) };
  }
  @Patch("profile") async update(@Body() input: unknown, @Req() request: any) {
    return {
      success: true,
      user: publicUser(await saveProfile(request.account.id, input)),
    };
  }
  @Get("providers") async providers(
    @Req() request: any,
    @Query("archived") archived = "0",
  ) {
    return {
      items: await listListings(request.account, false, archived === "1"),
    };
  }
  @Post("providers/:id/archive") async archive(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    const b = bodyObject(input);
    if (typeof b.archived !== "boolean") throw new BadRequestException();
    return archiveListing(request.account, id, b.archived);
  }
  @Post("providers") async create(@Body() input: unknown, @Req() request: any) {
    const body = bodyObject(input);
    return {
      success: true,
      provider: await saveListing(request.account, {
        ...body,
        kind: body.kind || request.account.role,
      }),
    };
  }
  @Patch("providers/:id") async updateProvider(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    return {
      success: true,
      provider: await saveListing(request.account, input, id),
    };
  }
}
@Controller("dashboard")
@UseGuards(SessionGuard)
class DashboardController {
  @Get("schema") schema() {
    return {
      roles,
      providerKinds,
      profileSteps,
      listingFields,
      modules,
      settingFields,
    };
  }
  @Get("facilities") async facilities(@Req() request: any) {
    return {
      items: (
        await db.query(
          `SELECT id,name,kind FROM providers p WHERE NOT p.archived AND kind IN ('hospital','clinic') AND (published OR $2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1)) ORDER BY name LIMIT 500`,
          [request.account.id, request.account.role === "admin"],
        )
      ).rows,
    };
  }
  @Get("records/:module") async records(
    @Param("module") key: string,
    @Req() request: any,
    @Query("page") page = "1",
    @Query("q") q = "",
  ) {
    moduleFor(key, request.account);
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1 || p > 10000)
      throw new BadRequestException();
    return {
      items: (
        await db.query(
          `SELECT * FROM dashboard_${key} WHERE (owner_id=$1 OR $2) AND NOT archived AND data::text ILIKE $4 ORDER BY updated_at DESC LIMIT 50 OFFSET $3`,
          [
            request.account.id,
            request.account.role === "admin",
            (p - 1) * 50,
            "%" + q.slice(0, 100) + "%",
          ],
        )
      ).rows,
      page: p,
    };
  }
  @Post("records/:module") async create(
    @Param("module") key: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    return { record: await recordSave(key, request.account, input) };
  }
  @Patch("records/:module/:id") async update(
    @Param("module") key: string,
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    return { record: await recordSave(key, request.account, input, id) };
  }
  @Post("records/:module/:id/archive") async archive(
    @Param("module") key: string,
    @Param("id") id: string,
    @Req() request: any,
  ) {
    moduleFor(key, request.account, true);
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    const found = await db.query(
      `UPDATE dashboard_${key} SET archived=true,updated_at=now() WHERE id=$1 AND (owner_id=$2 OR $3) RETURNING id`,
      [id, request.account.id, request.account.role === "admin"],
    );
    if (!found.rows[0]) throw new NotFoundException();
    return { success: true };
  }
  @Post("files") async upload(@Body() input: unknown, @Req() request: any) {
    const b = bodyObject(input),
      name = field(b.name, 150, true),
      type = field(b.type, 50, true);
    if (
      !["application/pdf", "image/png", "image/jpeg"].includes(type) ||
      typeof b.content !== "string" ||
      b.content.length > 1400000 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(b.content)
    )
      throw new BadRequestException("Upload a PDF, PNG or JPEG up to 1 MB");
    const content = Buffer.from(b.content, "base64");
    if (!content.length || content.length > 1048576)
      throw new BadRequestException("File exceeds 1 MB");
    const valid =
      type === "application/pdf"
        ? content.subarray(0, 5).toString() === "%PDF-"
        : type === "image/png"
          ? content.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
          : content.subarray(0, 3).toString("hex") === "ffd8ff";
    if (!valid)
      throw new BadRequestException("File content does not match its type");
    const count = await db.query(
      "SELECT count(*)::int count FROM account_files WHERE owner_id=$1",
      [request.account.id],
    );
    if (count.rows[0].count >= 100)
      throw new BadRequestException("Document limit reached");
    const id = randomUUID();
    await db.query(
      "INSERT INTO account_files(id,owner_id,name,content_type,content) VALUES($1,$2,$3,$4,$5)",
      [id, request.account.id, name, type, content],
    );
    return { id, name };
  }
  @Get("files/:id") async download(
    @Param("id") id: string,
    @Req() request: any,
    @Res() response: any,
  ) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    const result = await db.query(
      "SELECT * FROM account_files WHERE id=$1 AND (owner_id=$2 OR $3)",
      [id, request.account.id, request.account.role === "admin"],
    );
    const file = result.rows[0];
    if (!file) throw new NotFoundException();
    response.setHeader("Content-Type", file.content_type);
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="' +
        file.name.replace(/[^a-zA-Z0-9._-]/g, "_") +
        '"',
    );
    response.setHeader("Cache-Control", "no-store");
    response.send(file.content);
  }
}

@Controller("admin")
@UseGuards(SessionGuard, AdminGuard)
class AdminController {
  @Get("notification-count") async notificationCount() {
    const result = await db.query(
      "SELECT count(*)::int AS count FROM dashboard_notifications WHERE NOT archived AND data->>'status'='Unread'",
    );
    return result.rows[0];
  }
  @Get("search") async search(@Query("q") q = "") {
    if (q.length < 2 || q.length > 100) return { items: [] };
    const term = "%" + q + "%";
    const [providers, records, users] = await Promise.all([
      db.query(
        "SELECT id,name AS label,kind AS detail,'listings' AS section FROM providers WHERE NOT archived AND (name ILIKE $1 OR specialty ILIKE $1 OR area ILIKE $1) LIMIT 8",
        [term],
      ),
      db.query(
        "SELECT id,COALESCE(data->>'patientName',data->>'doctorName','Booking') AS label,data->>'date' AS detail,'appointments' AS section FROM dashboard_appointments WHERE NOT archived AND data::text ILIKE $1 LIMIT 5",
        [term],
      ),
      db.query(
        "SELECT id,name AS label,role AS detail,'users' AS section FROM app_users WHERE (name ILIKE $1 OR email ILIKE $1) AND status<>'disabled' LIMIT 5",
        [term],
      ),
    ]);
    return { items: [...providers.rows, ...records.rows, ...users.rows] };
  }
  @Get("overview") async overview(
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const end = to || new Date().toISOString().slice(0, 10);
    const start = from || end.slice(0, 8) + "01";
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
      !Number.isFinite(Date.parse(start)) ||
      !Number.isFinite(Date.parse(end)) ||
      new Date(start).toISOString().slice(0, 10) !== start ||
      new Date(end).toISOString().slice(0, 10) !== end ||
      start > end ||
      Date.parse(end) - Date.parse(start) > 366 * 86400000
    )
      throw new BadRequestException(
        "Choose a valid date range of up to one year",
      );
    const range = [start, end];
    const [
      listings,
      bookings,
      payments,
      articles,
      trend,
      revenue,
      recentBookings,
      recentPayments,
      recentArticles,
      doctors,
      locations,
      notifications,
    ] = await Promise.all([
      db.query(
        "SELECT kind,count(*)::int AS count FROM providers WHERE NOT archived GROUP BY kind",
      ),
      db.query(
        "SELECT data->>'status' AS status,count(*)::int AS count FROM dashboard_appointments WHERE NOT archived AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date GROUP BY 1",
        range,
      ),
      db.query(
        "SELECT data->>'status' AS status,count(*)::int AS count,sum(COALESCE(NULLIF(data->>'amount',''),'0')::numeric) AS amount FROM dashboard_payments WHERE NOT archived AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date GROUP BY 1",
        range,
      ),
      db.query(
        "SELECT data->>'status' AS status,count(*)::int AS count FROM dashboard_articles WHERE NOT archived GROUP BY 1",
      ),
      db.query(
        "SELECT COALESCE(NULLIF(data->>'date','')::date,created_at::date)::text AS date,data->>'status' AS status,count(*)::int AS count FROM dashboard_appointments WHERE NOT archived AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date GROUP BY 1,2 ORDER BY 1",
        range,
      ),
      db.query(
        "SELECT COALESCE(NULLIF(data->>'date','')::date,created_at::date)::text AS date,sum(COALESCE(NULLIF(data->>'amount',''),'0')::numeric) AS amount FROM dashboard_payments WHERE NOT archived AND data->>'status'='Paid' AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date GROUP BY 1 ORDER BY 1",
        range,
      ),
      db.query(
        "SELECT * FROM dashboard_appointments WHERE NOT archived AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date ORDER BY created_at DESC LIMIT 5",
        range,
      ),
      db.query(
        "SELECT * FROM dashboard_payments WHERE NOT archived AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date ORDER BY created_at DESC LIMIT 5",
        range,
      ),
      db.query(
        "SELECT * FROM dashboard_articles WHERE NOT archived ORDER BY created_at DESC LIMIT 5",
      ),
      db.query(
        "SELECT data->>'doctorName' AS name,count(*)::int AS count FROM dashboard_appointments WHERE NOT archived AND NULLIF(data->>'doctorName','') IS NOT NULL AND COALESCE(NULLIF(data->>'date','')::date,created_at::date) BETWEEN $1::date AND $2::date GROUP BY 1 ORDER BY 2 DESC LIMIT 5",
        range,
      ),
      db.query(
        "SELECT COALESCE(NULLIF(area,''),'Unspecified') AS name,count(*)::int AS count FROM providers WHERE NOT archived GROUP BY 1 ORDER BY 2 DESC LIMIT 5",
      ),
      db.query(
        "SELECT * FROM dashboard_notifications WHERE NOT archived AND COALESCE(data->>'status','Unread')='Unread' ORDER BY created_at DESC LIMIT 20",
      ),
    ]);
    return {
      from: start,
      to: end,
      listings: listings.rows,
      bookings: bookings.rows,
      payments: payments.rows,
      articles: articles.rows,
      trend: trend.rows,
      revenue: revenue.rows,
      recentBookings: recentBookings.rows,
      recentPayments: recentPayments.rows,
      recentArticles: recentArticles.rows,
      doctors: doctors.rows,
      locations: locations.rows,
      notifications: notifications.rows,
      system: [
        { name: "Website & database", state: "Operational", ok: true },
        { name: "Appointment records", state: "Connected", ok: true },
        {
          name: "Payment gateway",
          state: process.env.STRIPE_SECRET_KEY
            ? "Configured"
            : "Not configured",
          ok: !!process.env.STRIPE_SECRET_KEY,
        },
        {
          name: "Email delivery",
          state: process.env.RESEND_API_KEY ? "Configured" : "Not configured",
          ok: !!process.env.RESEND_API_KEY,
        },
        { name: "Scheduled jobs", state: "Not configured", ok: false },
      ],
    };
  }
  @Get("users") async users(
    @Query("page") page = "1",
    @Query("q") q = "",
    @Query("role") role = "",
  ) {
    const p = Number(page);
    if (!Number.isInteger(p) || p < 1 || p > 10000)
      throw new BadRequestException();
    const result = await db.query(
      `SELECT id,email,name,phone,role,status,email_verified,profile,created_at FROM app_users WHERE (name ILIKE $2 OR email ILIKE $2 OR role ILIKE $2) AND ($3='' OR role=$3) ORDER BY created_at DESC LIMIT 50 OFFSET $1`,
      [(p - 1) * 50, "%" + q.slice(0, 100) + "%", role],
    );
    return { items: result.rows.map(publicUser), page: p };
  }
  @Patch("users/:id") async user(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    const body = bodyObject(input);
    if (
      Object.keys(body).some((k) => !["role", "status"].includes(k)) ||
      !Object.keys(body).length
    )
      throw new BadRequestException();
    if (body.role && !roles.includes(body.role))
      throw new BadRequestException("Invalid role");
    if (body.status && !["active", "pending", "disabled"].includes(body.status))
      throw new BadRequestException("Invalid status");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(826041)");
      const found = await client.query(
        "SELECT * FROM app_users WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!found.rows[0]) throw new NotFoundException();
      if (body.role === "admin" && !found.rows[0].email_verified)
        throw new BadRequestException(
          "Verify this email before granting administrator access",
        );
      if (
        found.rows[0].role === "admin" &&
        ((body.role && body.role !== "admin") ||
          (body.status && body.status !== "active"))
      ) {
        const count = await client.query(
          "SELECT count(*)::int AS count FROM app_users WHERE role='admin' AND status='active'",
        );
        if (count.rows[0].count <= 1)
          throw new BadRequestException(
            "Cannot remove the last active administrator",
          );
      }
      const result = await client.query(
        "UPDATE app_users SET role=COALESCE($1,role),status=COALESCE($2,status),updated_at=now() WHERE id=$3 RETURNING *",
        [body.role || null, body.status || null, id],
      );
      if (
        (body.role && body.role !== found.rows[0].role) ||
        (body.status && body.status !== found.rows[0].status)
      )
        await client.query("DELETE FROM app_sessions WHERE user_id=$1", [id]);
      await client.query(
        "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
        [request.account.id, "user.permissions.updated", id],
      );
      await client.query("COMMIT");
      return { success: true, user: publicUser(result.rows[0]) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  @Get("providers") async providers(
    @Req() request: any,
    @Query("archived") archived = "0",
  ) {
    return {
      items: await listListings(request.account, true, archived === "1"),
    };
  }
  @Patch("profiles/:id") async editProfile(
    @Param("id") id: string,
    @Body() input: unknown,
  ) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new BadRequestException();
    const user = await saveProfile(id, input);
    if (!user) throw new NotFoundException();
    return { user: publicUser(user) };
  }
  @Get("settings") async settings() {
    return {
      data: (await db.query("SELECT data FROM site_settings WHERE id='site'"))
        .rows[0].data,
    };
  }
  @Patch("settings") async saveSettings(@Body() input: unknown) {
    const data = validateFields(input, settingFields);
    return {
      data: (
        await db.query(
          "UPDATE site_settings SET data=data||$1::jsonb,updated_at=now() WHERE id='site' RETURNING data",
          [data],
        )
      ).rows[0].data,
    };
  }
  @Patch("providers/:id") async provider(
    @Param("id") id: string,
    @Body() input: unknown,
    @Req() request: any,
  ) {
    const body = bodyObject(input);
    if (
      Object.keys(body).some(
        (k) => !["published", "verified", "ownerId"].includes(k),
      )
    )
      throw new BadRequestException();
    for (const key of ["published", "verified"])
      if (body[key] !== undefined && typeof body[key] !== "boolean")
        throw new BadRequestException();
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const found = await client.query(
        "SELECT id,archived FROM providers WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!found.rows[0]) throw new NotFoundException();
      if (found.rows[0].archived && body.published)
        throw new BadRequestException("Restore this profile before publishing");
      if (body.ownerId !== undefined) {
        if (
          typeof body.ownerId !== "string" ||
          !/^[a-f0-9-]{36}$/.test(body.ownerId)
        )
          throw new BadRequestException("Invalid owner");
        const owner = await client.query(
          "SELECT id FROM app_users WHERE id=$1 AND role IN ('doctor','clinic','hospital','lab','surgeon','technician') AND status='active'",
          [body.ownerId],
        );
        if (!owner.rows[0])
          throw new BadRequestException("Assign an approved provider account");
        await client.query(
          "DELETE FROM provider_memberships WHERE provider_id=$1",
          [id],
        );
        await client.query(
          "INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2)",
          [id, body.ownerId],
        );
      }
      const result = await client.query(
        `UPDATE providers SET published=COALESCE($1,published),verified=COALESCE($2,verified),updated_at=now() WHERE id=$3 RETURNING *`,
        [body.published ?? null, body.verified ?? null, id],
      );
      await client.query(
        "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
        [request.account.id, "provider.updated", id],
      );
      await client.query("COMMIT");
      return { success: true, provider: result.rows[0] };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  @Get("audit") async audit() {
    return {
      items: (
        await db.query("SELECT * FROM account_audit ORDER BY id DESC LIMIT 100")
      ).rows,
    };
  }
}
@Module({
  controllers: [
    AuthController,
    ProfileController,
    AdminController,
    DashboardController,
  ],
  providers: [Accounts, SessionGuard, AdminGuard],
})
export class AccountsModule {}
