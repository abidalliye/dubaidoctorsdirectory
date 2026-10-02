// Explicit live verification against real database-backed endpoints, with synthetic data only.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
const site = process.env.CHECK_SITE || "https://fertifind-dubai.netlify.app",
  run = randomUUID();
async function request(path, method = "GET", body, session = {}) {
  const response = await fetch(site + "/v1/" + path, {
    method,
    headers: {
      Origin: site,
      "Content-Type": "application/json",
      "X-Requested-With": "FertiFind",
      ...(session.cookie
        ? { Cookie: session.cookie, "X-CSRF-Token": session.csrf }
        : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(25000),
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) {
    session.cookie = cookies.map((c) => c.split(";")[0]).join("; ");
    session.csrf = cookies
      .find((c) => c.startsWith("ff_csrf="))
      ?.split(";")[0]
      .slice(8);
  }
  const result = await response.json().catch(() => ({}));
  return { status: response.status, result };
}
async function ok(path, method, body, session, status = 200) {
  const r = await request(path, method, body, session);
  assert.equal(r.status, status, path + ": " + JSON.stringify(r.result));
  return r.result;
}
async function signup(role) {
  const password = randomBytes(24).toString("hex"),
    email = `codex-dashboard-${run}-${role}@example.invalid`,
    session = {};
  const { user } = await ok(
    "auth/register",
    "POST",
    { name: "Synthetic " + role, email, password, role },
    session,
    201,
  );
  return { user, password, email, session };
}
const patient = await signup("patient"),
  doctor = await signup("doctor"),
  hospital = await signup("hospital"),
  lab = await signup("lab");
const schema = await ok("dashboard/schema", "GET", null, doctor.session);
function value(f) {
  return f.type === "select"
    ? f.options.find(Boolean) || ""
    : f.type === "date"
      ? "2026-10-02"
      : f.type === "datetime-local"
        ? "2026-10-02T10:30"
        : f.type === "number"
          ? "25"
          : f.type === "url"
            ? "https://example.invalid/profile"
            : f.type === "email"
              ? "synthetic@example.invalid"
              : f.type === "affiliations"
                ? []
                : f.key === "profileComplete"
                  ? "yes"
                  : "Synthetic " + f.key;
}
for (const account of [patient, doctor, hospital, lab]) {
  const fields = schema.profileSteps[
      account.user.role === "patient" ? "patient" : "business"
    ].flatMap((s) => s.fields),
    profile = Object.fromEntries(fields.map((f) => [f.key, value(f)]));
  await ok(
    "account/profile",
    "PATCH",
    { ...profile, profileComplete: "yes" },
    account.session,
  );
  const saved = (await ok("account/profile", "GET", null, account.session))
    .user;
  for (const [key, v] of Object.entries(profile))
    assert.equal(
      ["name", "phone"].includes(key) ? saved[key] : saved.profile[key],
      v,
      key,
    );
}
const providers = [];
for (const [account, kind] of [
  [doctor, "doctor"],
  [lab, "lab"],
  [hospital, "doctor"],
  [hospital, "lab"],
  [hospital, "hospital"],
]) {
  const data = Object.fromEntries(
    schema.listingFields.map((f) => [
      f.key,
      f.key === "kind" ? kind : value(f),
    ]),
  );
  data.name = "Synthetic " + kind + " " + run;
  data.services = "Test one, Test two";
  const p = (await ok("account/providers", "POST", data, account.session, 201))
    .provider;
  providers.push(p);
  const saved = (
    await ok("account/providers", "GET", null, account.session)
  ).items.find((x) => x.id === p.id);
  assert.equal(saved.kind, kind);
  assert.deepEqual(saved.affiliationIds, []);
  assert.equal(saved.details.qualifications, "Synthetic qualifications");
  assert.equal(
    (
      await request(
        "account/providers/" + p.id,
        "PATCH",
        { name: "Attack" },
        patient.session,
      )
    ).status,
    403,
  );
}
const facility = providers.at(-1),
  child = providers[2];
await ok(
  "account/providers/" + child.id,
  "PATCH",
  { affiliationIds: [facility.id] },
  hospital.session,
);
assert.deepEqual(
  (await ok("account/providers", "GET", null, hospital.session)).items.find(
    (x) => x.id === child.id,
  ).affiliationIds,
  [facility.id],
);
assert.equal(
  (
    await request(
      "account/providers/" + providers[0].id,
      "PATCH",
      { name: "Attack" },
      lab.session,
    )
  ).status,
  404,
);
assert.equal(
  (await request("admin/users", "GET", null, doctor.session)).status,
  403,
);
const pdf = Buffer.from("%PDF-1.4\nSynthetic test file\n%%EOF");
const archivedProvider = providers[0];
await ok(
  "account/providers/" + archivedProvider.id + "/archive",
  "POST",
  { archived: true },
  doctor.session,
  201,
);
assert.ok(
  !(await ok("account/providers", "GET", null, doctor.session)).items.some(
    (p) => p.id === archivedProvider.id,
  ),
);
assert.ok(
  (
    await ok("account/providers?archived=1", "GET", null, doctor.session)
  ).items.find((p) => p.id === archivedProvider.id).archived,
);
await ok(
  "account/providers/" + archivedProvider.id + "/archive",
  "POST",
  { archived: false },
  doctor.session,
  201,
);
assert.equal(
  (await ok("account/providers", "GET", null, doctor.session)).items.find(
    (p) => p.id === archivedProvider.id,
  ).published,
  false,
);
const file = await ok(
  "dashboard/files",
  "POST",
  {
    name: "synthetic.pdf",
    type: "application/pdf",
    content: pdf.toString("base64"),
  },
  patient.session,
  201,
);
for (const [key, module] of Object.entries(schema.modules)) {
  const account = [patient, doctor, hospital, lab].find((a) =>
    module.roles.includes(a.user.role),
  );
  assert.ok(account, key);
  const data = Object.fromEntries(
    module.fields.map((f) => [f.key, f.type === "file" ? file.id : value(f)]),
  );
  if (["appointments", "lab_requests"].includes(key)) data.status = "Requested";
  if (key === "reviews") data.status = "Pending";
  const record = (
    await ok("dashboard/records/" + key, "POST", data, account.session, 201)
  ).record;
  assert.deepEqual(
    (
      await ok("dashboard/records/" + key, "GET", null, account.session)
    ).items.find((x) => x.id === record.id).data,
    data,
    key,
  );
  const other = account === patient ? doctor : patient;
  assert.ok(
    !(
      await ok("dashboard/records/" + key, "GET", null, other.session)
    ).items.some((x) => x.id === record.id),
  );
  assert.equal(
    (
      await request(
        "dashboard/records/" + key + "/" + record.id,
        "PATCH",
        data,
        other.session,
      )
    ).status,
    module.roles.includes(other.user.role)
      ? key === "documents"
        ? 400
        : 404
      : 403,
  );
  const first = module.fields.find(
    (f) =>
      !f.options &&
      !["file", "date", "datetime-local", "number", "url", "email"].includes(
        f.type,
      ),
  );
  data[first.key] = "Updated synthetic field";
  await ok(
    "dashboard/records/" + key + "/" + record.id,
    "PATCH",
    data,
    account.session,
  );
  assert.equal(
    (
      await ok("dashboard/records/" + key, "GET", null, account.session)
    ).items.find((x) => x.id === record.id).data[first.key],
    "Updated synthetic field",
  );
  await ok(
    "dashboard/records/" + key + "/" + record.id + "/archive",
    "POST",
    {},
    account.session,
    201,
  );
  assert.ok(
    !(
      await ok("dashboard/records/" + key, "GET", null, account.session)
    ).items.some((x) => x.id === record.id),
  );
}
const download = await fetch(site + "/v1/dashboard/files/" + file.id, {
  headers: { Cookie: patient.session.cookie },
});
assert.equal(download.status, 200);
assert.equal(
  Buffer.from(await download.arrayBuffer()).toString(),
  pdf.toString(),
);
assert.equal(
  (await request("dashboard/files/" + file.id, "GET", null, doctor.session))
    .status,
  404,
);

for (const a of [patient, doctor, hospital, lab])
  await ok("auth/logout", "POST", {}, a.session, 201);
console.log(
  "Passed all profile fields for four roles, independent and facility-linked doctor/lab creation, all 13 module save/read/edit/archive flows, private document upload/download, and cross-account access checks.",
);
console.log("Synthetic run: " + run);
