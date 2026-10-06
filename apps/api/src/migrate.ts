import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {db} from './db';
async function run(){
  try{for(const file of ['002-auth.sql','003-dashboard.sql','004-care-workflows.sql','005-business-details.sql'])await db.query(readFileSync(resolve(__dirname,'../../../infra/db/'+file),'utf8'));console.log('Account and care schemas installed. Existing provider records preserved.');}
  finally{await db.end();}
}
run().catch(()=>{console.error('Migration failed. Check database access.');process.exitCode=1;});
