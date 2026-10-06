import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import pg from 'pg';

// Keep the deployment credential in memory and never print it.
let client;
let stage='load Netlify database configuration';
try {
  const raw=process.env.DATABASE_URL || JSON.parse(execFileSync(process.execPath,['node_modules/netlify-cli/bin/run.js','env:get','DATABASE_URL','--context','production','--scope','functions','--filter','@fertifind/web','--json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']})).DATABASE_URL;
  const connectionString=typeof raw==='string'?raw.trim().replace(/^['"]|['"]$/g,''):raw?.value;
  if(!/^postgres(ql)?:\/\//.test(connectionString))throw new Error('Missing database configuration');
  stage='connect to database';
  client=new pg.Client({connectionString,connectionTimeoutMillis:10000});
  await client.connect();
  stage='verify existing records and apply care schema';
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout='10s'");
  await client.query('LOCK TABLE app_users, providers IN SHARE MODE');
  const fingerprint=()=>client.query("SELECT (SELECT md5(string_agg(row_to_json(u)::text,'' ORDER BY id)) FROM app_users u) AS users, (SELECT md5(string_agg(row_to_json(p)::text,'' ORDER BY id)) FROM providers p) AS providers");
  const before=(await fingerprint()).rows[0];
  for(const file of ['004-care-workflows.sql','005-business-details.sql']){
    const sql=readFileSync(new URL('../infra/db/'+file,import.meta.url),'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'');
    await client.query(sql);
  }
  const after=(await fingerprint()).rows[0];
  if(JSON.stringify(before)!==JSON.stringify(after))throw new Error('Preservation verification failed');
  await client.query('COMMIT');
  console.log('Care schema ready. Existing accounts, password hashes and provider records verified unchanged.');
} catch (error) {
  if(client)await client.query('ROLLBACK').catch(()=>{});
  console.error(`Production preparation failed at: ${stage}. Error code: ${/^[A-Z0-9_]+$/.test(String(error.code))?error.code:'unavailable'}. Transaction rolled back.`);
  process.exitCode=1;
} finally {if(client)await client.end()}
