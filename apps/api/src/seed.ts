import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";
async function seed() {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const [folder, kind] of [
      ["doctors", "doctor"],
      ["clinics", "clinic"],
    ]) {
      const dir = resolve(__dirname, "../../../_data", folder);
      for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
        const p = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
        const slug =
          p.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          p.id.toLowerCase();
        await client.query(
          `INSERT INTO providers(id,slug,name,kind,specialty,area,address,services,phone,website,verified) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) ON CONFLICT(id) DO NOTHING`,
          [
            p.id,
            slug,
            p.name,
            kind,
            p.specialty || p.category || "",
            p.area || "",
            p.address || "",
            (p.services || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
            p.phone || "",
            p.website || "",
          ],
        );
      }
    }
    await client.query("COMMIT");
    console.log(
      "Imported legacy listings as unverified; existing records preserved.",
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await db.end();
  }
}
seed();
