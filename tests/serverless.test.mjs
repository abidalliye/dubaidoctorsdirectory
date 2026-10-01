import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

test("Netlify handler reuses NestJS and preserves routing, query validation and outage responses", async () => {
  process.env.DATABASE_URL = "postgres://test:secret@127.0.0.1:1/test";
  process.env.REDIS_URL = "";
  process.env.TYPESENSE_API_KEY = "";
  const { handler } = require("../netlify/functions/api.js");
  const invoke = (path, queryStringParameters = {}) =>
    handler(
      {
        httpMethod: "GET",
        path,
        headers: { host: "test.netlify.app" },
        queryStringParameters,
        multiValueQueryStringParameters: {},
        body: null,
        isBase64Encoded: false,
      },
      {},
    );
  for (const path of [
    "/v1/providers",
    "/.netlify/functions/api/v1/providers",
  ]) {
    const result = await invoke(path, { limit: "100" });
    assert.equal(result.statusCode, 400);
  }
  const result = await invoke("/v1/health");
  assert.equal(result.statusCode, 503);
  assert.ok(!result.body.includes("secret"));
  const missing = await invoke("/v1/missing");
  assert.equal(missing.statusCode, 404);
  await require("../apps/api/dist/db.js").db.end();
});
