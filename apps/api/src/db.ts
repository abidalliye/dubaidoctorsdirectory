import { Pool } from "pg";
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_SIZE || (process.env.NETLIFY ? 2 : 10)),
  idleTimeoutMillis: 10000,
  allowExitOnIdle: true,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});
export const columns = `id, slug, name, kind, specialty, area, address, services, phone, website, verified, details`;
