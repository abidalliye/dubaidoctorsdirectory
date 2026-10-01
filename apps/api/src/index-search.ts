import Typesense from "typesense";
import { db } from "./db";
async function index() {
  if (!process.env.TYPESENSE_API_KEY)
    throw new Error("TYPESENSE_API_KEY required");
  const client = new Typesense.Client({
    nodes: [
      {
        host: process.env.TYPESENSE_HOST || "localhost",
        port: Number(process.env.TYPESENSE_PORT || 8108),
        protocol: process.env.TYPESENSE_PROTOCOL || "http",
      },
    ],
    apiKey: process.env.TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 5,
  });
  try {
    try {
      await client.collections("providers").retrieve();
    } catch (e) {
      if ((e as { httpStatus?: number }).httpStatus !== 404) throw e;
      await client.collections().create({
        name: "providers",
        fields: [
          { name: "name", type: "string" },
          { name: "slug", type: "string" },
          { name: "kind", type: "string", facet: true },
          { name: "specialty", type: "string" },
          { name: "area", type: "string", facet: true },
          { name: "services", type: "string[]", facet: true },
          { name: "location", type: "geopoint", optional: true },
        ],
      });
    }
    let last = "";
    let total = 0;
    while (true) {
      const { rows } = await db.query(
        `SELECT id,slug,name,kind,specialty,area,services,ST_Y(location::geometry) lat,ST_X(location::geometry) lng FROM providers WHERE published AND id > $1 ORDER BY id LIMIT 500`,
        [last],
      );
      if (!rows.length) break;
      const docs = rows.map(({ lat, lng, ...p }) => ({
        ...p,
        ...(lat !== null ? { location: [lat, lng] } : {}),
      }));
      const result = await client
        .collections("providers")
        .documents()
        .import(docs, { action: "upsert" });
      if (result.some((r) => !r.success))
        throw new Error("Search indexing failed for one or more records");
      total += rows.length;
      last = rows.at(-1).id;
    }
    console.log(`Indexed ${total} providers`);
  } finally {
    await db.end();
  }
}
index();
