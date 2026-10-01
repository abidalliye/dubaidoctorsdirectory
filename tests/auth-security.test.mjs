import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
const require=createRequire(import.meta.url);
const security=require('../apps/api/dist/security.js');

test('Password hashing uses independent salts, preserves spaces, and rejects wrong passwords',async()=>{
  const password='  my secure test passphrase  ';
  const a=await security.passwordHash(password),b=await security.passwordHash(password);
  assert.notEqual(a,b);assert.ok(!a.includes(password));
  assert.equal(await security.checkPassword(password,a),true);
  assert.equal(await security.checkPassword(password.trim(),a),false);
  assert.equal(await security.checkPassword('wrong password',a),false);
  assert.equal(await security.checkPassword(password),false);
  assert.throws(()=>security.validatePassword('short'));
  const cookies=[];
  security.setSessionCookies({setHeader:(name,value)=>cookies.push(...value)},'opaque','csrf');
  assert.ok(cookies.every(cookie=>cookie.includes('; Secure')),'Secure cookies must not rely on a build-time NETLIFY flag');
});

test('Server rejects forged sessions, cross-site mutations, and admin registration without database access',async()=>{
  const child=spawn(process.execPath,['apps/api/dist/main.js'],{env:{...process.env,PORT:'14402',DATABASE_URL:'postgres://test:private@127.0.0.1:1/test',WEB_ORIGIN:'http://127.0.0.1:4000',REDIS_URL:'',TYPESENSE_API_KEY:''},stdio:'ignore'});
  const origin='http://127.0.0.1:14402/v1/';
  try{
    let ready=false;for(let i=0;i<40;i++){try{await fetch(origin+'auth/me');ready=true;break;}catch{await setTimeout(250);}}
    assert.ok(ready);
    for(const route of ['auth/me','account/profile','account/providers','admin/users','admin/providers','admin/audit']){
      const response=await fetch(origin+route,{headers:{Cookie:'ff_auth_session=forged; ff_user=admin; ff_session=fake'}});
      assert.equal(response.status,401,route);assert.equal(response.headers.get('cache-control'),'no-store');
    }
    const registration={email:'test@example.invalid',name:'Test',password:'test-password-123',role:'admin'};
    const request=async(headers,body=registration)=>fetch(origin+'auth/register',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
    assert.equal((await request({Origin:'https://attacker.invalid','X-Requested-With':'FertiFind'})).status,403);
    assert.equal((await request({Origin:'http://127.0.0.1:4000'})).status,403);
    assert.equal((await request({Origin:'http://127.0.0.1:4000','X-Requested-With':'FertiFind'})).status,400);
    assert.equal((await request({Origin:'http://127.0.0.1:4000','X-Requested-With':'FertiFind'},{...registration,role:'patient',password:'short'})).status,400);
    const response=await request({Origin:'http://127.0.0.1:4000','X-Requested-With':'FertiFind'},{...registration,role:'patient'});
    assert.equal(response.status,503);assert.ok(!(await response.text()).includes('private'));
  }finally{child.kill();}
});
