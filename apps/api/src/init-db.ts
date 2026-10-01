import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";
async function init() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = readFileSync(
    resolve(__dirname, "../../../infra/db/001-directory.sql"),
    "utf8",
  );
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Directory schema initialized.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await db.end();
  }
}
init();
