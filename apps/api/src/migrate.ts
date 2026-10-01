import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {db} from './db';
async function run(){
  try{for(const file of ['002-auth.sql','003-dashboard.sql'])await db.query(readFileSync(resolve(__dirname,'../../../infra/db/'+file),'utf8'));console.log('Account schema installed. Existing provider records preserved.');}
  finally{await db.end();}
}
run().catch(()=>{console.error('Migration failed. Check database access.');process.exitCode=1;});
