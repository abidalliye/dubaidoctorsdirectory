import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {db}=require('../apps/api/dist/db.js');
// No seeding, account provisioning or data resets belong in a release.
try {
  if(!process.env.DATABASE_URL)throw new Error('Database configuration unavailable');
  const result=await db.query(`SELECT to_regclass('care_appointments') IS NOT NULL AND to_regclass('care_provider_hours') IS NOT NULL AND EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='provider_memberships' AND column_name='permission') AS ready`);
  if(!result.rows[0].ready)throw new Error('Care migrations must be applied before release');
  console.log('Release schema check passed.');
} catch {
  console.error('Release blocked: the production database must be reachable with care migrations 004 and 005 installed. No data was changed by this check.');
  process.exitCode=1;
} finally {await db.end()}
