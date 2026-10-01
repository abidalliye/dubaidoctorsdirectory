import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  validateFields,
  accountFields,
  moduleFor,
} = require("../apps/api/dist/dashboard-data.js");
const {
  listingFields,
  modules,
  profileSteps,
} = require("../apps/api/dist/dashboard-schema.js");
test("Dashboard validates business types, optional affiliations and every profile field", () => {
  for (const kind of ["doctor", "lab", "hospital", "clinic"])
    assert.equal(
      validateFields(
        { name: "Independent business", kind, affiliationIds: [] },
        listingFields,
        false,
      ).kind,
      kind,
    );
  assert.throws(() =>
    validateFields({ name: "Test", kind: "admin" }, listingFields, false),
  );
  assert.throws(() => validateFields({ role: "admin" }, accountFields));
  assert.throws(() =>
    validateFields({ photoUrl: "javascript:alert(1)" }, accountFields),
  );
  assert.throws(() =>
    validateFields({ dateOfBirth: "tomorrow" }, accountFields),
  );
  assert.throws(() => validateFields({ experienceYears: "-1" }, accountFields));
  const profile = {
    name: "Test",
    emergencyPhone: "+971 123",
    bloodGroup: "O+",
    medicalHistory: "Private test",
    profileComplete: "yes",
  };
  assert.deepEqual(validateFields(profile, accountFields), profile);
  for (const step of [...profileSteps.patient, ...profileSteps.business])
    assert.ok(
      step.fields.every((f) => accountFields.some((a) => a.key === f.key)),
    );
});
test("Dashboard schema rejects unknown tables and clinical writes by patients", () => {
  assert.throws(() =>
    moduleFor("appointments;DROP TABLE app_users", { role: "admin" }, true),
  );
  for (const module of ["notes", "prescriptions", "payments", "admissions"])
    assert.throws(() => moduleFor(module, { role: "patient" }, true));
  assert.equal(
    moduleFor("lab_requests", { role: "lab" }, true).label,
    "Lab requests",
  );
  for (const [key, m] of Object.entries(modules)) {
    const required = Object.fromEntries(
      m.fields
        .filter((f) => f.required)
        .map((f) => [
          f.key,
          f.options?.[0] ||
            (f.type === "number"
              ? "25"
              : f.type === "date"
                ? "2026-10-02"
                : f.type === "datetime-local"
                  ? "2026-10-02T10:30"
                  : f.type === "file"
                    ? "00000000-0000-0000-0000-000000000000"
                    : "Test"),
        ]),
    );
    assert.doesNotThrow(() => validateFields(required, m.fields, false), key);
    assert.throws(() =>
      validateFields(
        { ...required, owner_id: "someone-else" },
        m.fields,
        false,
      ),
    );
  }
});
