// Isolated local preview only. Never imports production credentials or seeds Neon.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
const require = createRequire(import.meta.url);
process.env.DATABASE_URL = "postgres://local-preview";
process.env.WEB_ORIGIN = "http://localhost:3000";
process.env.NODE_ENV = "development";
process.env.RESEND_API_KEY = "";
process.env.TYPESENSE_API_KEY = "";
process.env.REDIS_URL = "";
const pg = await PGlite.create();
await pg.exec(
  readFileSync("infra/db/001-directory.sql", "utf8")
    .replace("CREATE EXTENSION IF NOT EXISTS postgis;", "")
    .replace("geography(Point,4326)", "text")
    .replace(/CREATE INDEX IF NOT EXISTS providers_location[^;]+;/, ""),
);
for (const file of [
  "002-auth.sql",
  "003-dashboard.sql",
  "004-care-workflows.sql",
  "005-business-details.sql",
])
  await pg.exec(readFileSync("infra/db/" + file, "utf8"));
const { db } = require("../apps/api/dist/db.js");
db.query = (sql, params) => pg.query(sql, params);
db.connect = async () => ({
  query: (sql, params) => pg.query(sql, params),
  release() {},
});
db.end = () => pg.close();
const { passwordHash } = require("../apps/api/dist/security.js");
const users = {};
for (const role of [
  "admin",
  "patient",
  "doctor",
  "hospital",
  "clinic",
  "lab",
  "technician",
]) {
  users[role] = randomUUID();
  await pg.query(
    `INSERT INTO app_users(id,email,password_hash,name,role,status,email_verified) VALUES($1,$2,$3,$4,$5,'active',true)`,
    [
      users[role],
      role + "@preview.invalid",
      await passwordHash("Preview-only-password-123!"),
      "Preview " + role,
      role,
    ],
  );
}
for (const [kind, name, specialty] of [
  ["doctor", "Preview Doctor", "General Practice"],
  ["hospital", "Preview Hospital", "Multispecialty Care"],
  ["clinic", "Preview Clinic", "Family Medicine"],
  ["lab", "Preview Laboratory", "Diagnostics"],
]) {
  const id = "preview-" + kind;
  await pg.query(
    `INSERT INTO providers(id,slug,name,kind,specialty,area,services,details) VALUES($1,$1,$2,$3,$4,'Dubai',ARRAY['Consultation'],'{"bio":"Isolated preview data. Not a real provider."}')`,
    [id, name, kind, specialty],
  );
  await pg.query(
    "INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2)",
    [id, users[kind]],
  );
  const service = randomUUID();
  await pg.query(
    `INSERT INTO care_services(id,provider_id,name,price_minor,duration_minutes,mode) VALUES($1,$2,$3,12500,30,'In clinic')`,
    [
      service,
      id,
      kind === "lab" ? "Preview Blood Test" : "Preview Consultation",
    ],
  );
  for (let i = 1; i <= 4; i++)
    await pg.query(
      `INSERT INTO care_slots(id,service_id,starts_at,ends_at) VALUES($1,$2,now()+$3*interval '1 day',now()+$3*interval '1 day'+interval '30 minutes')`,
      [randomUUID(), service, i],
    );
}
// Clearly synthetic fixtures exercise populated charts and tables without touching Neon.
const doctorService=(await pg.query("SELECT id FROM care_services WHERE provider_id='preview-doctor'")).rows[0].id;
for(let day=1;day<=12;day++){
 const slot=randomUUID(),appointment=randomUUID();
 const status=day%4===0?'Cancelled':day%3===0?'Requested':'Confirmed';
 await pg.query("INSERT INTO care_slots(id,service_id,starts_at,ends_at) VALUES($1,$2,date_trunc('month',now())+($3||' days')::interval,date_trunc('month',now())+($3||' days')::interval+interval '30 minutes')",[slot,doctorService,String(day)]);
 await pg.query("INSERT INTO care_appointments(id,patient_id,slot_id,provider_id,service_id,patient_name,status,price_minor) VALUES($1,$2,$3,'preview-doctor',$4,'Synthetic Preview Patient',$5,12500)",[appointment,users.patient,slot,doctorService,status]);
 if(status==='Confirmed')await pg.query("INSERT INTO care_invoices(id,appointment_id,amount_minor,status,payment_method,paid_at) VALUES($1,$2,12500,'Paid','Cash',date_trunc('month',now())+($3||' days')::interval)",[randomUUID(),appointment,String(day)]);
}
for(let i=1;i<=3;i++)await pg.query("INSERT INTO dashboard_articles(id,owner_id,data) VALUES($1,$2,$3)",[randomUUID(),users.admin,JSON.stringify({title:'Preview directory guide '+i,slug:'preview-guide-'+i,category:'Directory',status:i===3?'Draft':'Published',author:'Preview editor',body:'Synthetic local preview article. This is not medical guidance.'})]);
const { createApplication } = require("../apps/api/dist/app.js");
const app = await createApplication();
await app.listen(4000, "127.0.0.1");
console.log(
  "Isolated preview API ready on port 4000. No production data is connected.",
);
