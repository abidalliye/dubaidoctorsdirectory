// Explicit deployment check only; synthetic accounts never contain patient data.
// Disable the codex-check-* accounts after verification using trusted DB access.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const site=process.env.CHECK_SITE || 'https://fertifind-dubai.netlify.app';
const runId=randomUUID(),headers={Origin:site,'X-Requested-With':'FertiFind','Content-Type':'application/json'};
async function request(path,method='GET',body,session={}){
  const response=await fetch(site+'/v1/'+path,{method,headers:{...headers,...(session.cookie?{Cookie:session.cookie,'X-CSRF-Token':session.csrf||''}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  const cookies=response.headers.getSetCookie();
  if(cookies.length){session.cookie=cookies.map(c=>c.split(';')[0]).join('; ');session.csrf=cookies.find(c=>c.startsWith('ff_csrf='))?.split(';')[0].slice(8);}
  return {response,result};
}
async function ok(path,method,body,session,status=200){const result=await request(path,method,body,session);assert.equal(result.response.status,status,path+': '+JSON.stringify(result.result));return result;}
async function register(role){
  const session={};const password=randomBytes(24).toString('hex'),email=`codex-check-${runId}-${role}@example.invalid`;
  const {response,result}=await ok('auth/register','POST',{email,password,name:'Deployment check '+role,role},session,201);
  assert.equal(result.user.role,role);assert.equal(result.user.status,role==='patient'?'active':'pending');assert.ok(!('password_hash' in result.user));
  const raw=response.headers.getSetCookie().find(c=>c.startsWith('ff_session='));assert.match(raw,/HttpOnly/i);assert.match(raw,/Secure/i);assert.match(raw,/SameSite=Lax/i);
  return {session,password,email,user:result.user};
}
const patient=await register('patient'),doctor=await register('doctor'),clinic=await register('clinic'),hospital=await register('hospital');
assert.equal((await request('auth/me')).response.status,401);
await ok('account/profile','PATCH',{name:'Persisted deployment check',area:'Dubai'},patient.session);
assert.equal((await ok('account/profile','GET',null,patient.session)).result.user.name,'Persisted deployment check');
assert.equal((await ok('account/profile','GET',null,doctor.session)).result.user.name,'Deployment check doctor');
assert.equal((await request('account/profile','PATCH',{role:'admin'},patient.session)).response.status,400);
assert.equal((await request('account/profile','PATCH',{emailVerified:true},patient.session)).response.status,400);
assert.equal((await request('account/profile','PATCH',{name:'forged csrf'},{cookie:patient.session.cookie,csrf:'a'.repeat(64)})).response.status,403);
assert.equal((await request('admin/users','GET',null,doctor.session)).response.status,403);
assert.equal((await request('admin/providers','GET',null,patient.session)).response.status,403);
assert.equal((await request('account/providers','POST',{name:'Patient cannot create provider'},patient.session)).response.status,403);
const provider=(await ok('account/providers','POST',{name:'Synthetic deployment check '+runId,specialty:'Testing'},doctor.session,201)).result.provider;
assert.equal(provider.published,false);assert.equal(provider.verified,false);
assert.equal((await request('providers/'+provider.slug)).response.status,404);
await ok('account/providers/'+provider.id,'PATCH',{name:'Edited synthetic deployment check'},doctor.session);
assert.equal((await request('account/providers/'+provider.id,'PATCH',{name:'Unauthorized edit'},clinic.session)).response.status,404);
assert.equal((await request('account/providers/'+provider.id,'PATCH',{published:true},doctor.session)).response.status,400);
const originalSession={...patient.session};
await ok('auth/password','POST',{currentPassword:patient.password,password:'  replacement test password  '},patient.session,201);
assert.equal((await request('auth/me','GET',null,originalSession)).response.status,401);
assert.equal((await request('auth/login','POST',{email:patient.email,password:patient.password})).response.status,401);
const loginSession={};await ok('auth/login','POST',{email:patient.email,password:'  replacement test password  '},loginSession,201);
await ok('auth/logout','POST',{},loginSession,201);
assert.equal((await request('auth/me','GET',null,loginSession)).response.status,401);
console.log('Passed live signup, login, profile persistence, session rotation, logout, roles, CSRF and provider ownership checks.');
console.log('Synthetic account run ID: '+runId);
