import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {db} from './db';
async function run(){
  try{await db.query(readFileSync(resolve(__dirname,'../../../infra/db/002-auth.sql'),'utf8'));console.log('Account schema installed. Existing provider records preserved.');}
  finally{await db.end();}
}
run().catch(()=>{console.error('Migration failed. Check database access.');process.exitCode=1;});
