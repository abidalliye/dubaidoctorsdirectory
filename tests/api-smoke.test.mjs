import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

test("API validates requests and handles database outage without leaking connection details", async () => {
  const port = 14401;
  const child = spawn(process.execPath, ["apps/api/dist/main.js"], {
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: "postgres://test:secret@127.0.0.1:1/test",
      REDIS_URL: "",
      TYPESENSE_API_KEY: "",
    },
    stdio: "ignore",
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        await fetch(`http://127.0.0.1:${port}/v1/health`);
        ready = true;
        break;
      } catch {
        await setTimeout(250);
      }
    }
    assert.ok(ready, "API should start");
    for (const query of [
      "page=0",
      "limit=100",
      "kind=admin",
      "lat=91&lng=55",
      "q=x&q=y",
    ]) {
      const response = await fetch(
        `http://127.0.0.1:${port}/v1/providers?${query}`,
      );
      assert.equal(response.status, 400, query);
    }
    for (const route of ["health", "providers", "providers/test"]) {
      const response = await fetch(`http://127.0.0.1:${port}/v1/${route}`);
      assert.equal(response.status, 503, route);
      assert.ok(!(await response.text()).includes("secret"));
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    }
  } finally {
    child.kill();
  }
});
