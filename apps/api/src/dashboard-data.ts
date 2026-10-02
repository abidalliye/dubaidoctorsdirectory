import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { field, bodyObject, emailAddress } from "./security";
import {
  FieldSpec,
  profileSteps,
  listingFields,
  modules,
  providerKinds,
} from "./dashboard-schema";
export function validateFields(
  input: unknown,
  specs: FieldSpec[],
  partial = true,
) {
  const body = bodyObject(input),
    out: Record<string, any> = {};
  if (Object.keys(body).some((k) => !specs.some((f) => f.key === k)))
    throw new BadRequestException("Unknown field");
  for (const s of specs) {
    if (body[s.key] === undefined) {
      if (!partial && s.required)
        throw new BadRequestException(s.label + " is required");
      continue;
    }
    let value = body[s.key];
    if (s.type === "affiliations") {
      if (
        !Array.isArray(value) ||
        value.length > 20 ||
        value.some((v) => typeof v !== "string" || v.length > 150)
      )
        throw new BadRequestException("Invalid affiliations");
      out[s.key] = [...new Set(value)];
      continue;
    }
    value = field(
      value,
      s.max || (s.type === "textarea" ? 12000 : 500),
      s.required,
    );
    if (value && s.type === "email") value = emailAddress(value);
    if (value && s.type === "url") {
      try {
        if (!["http:", "https:"].includes(new URL(value).protocol))
          throw Error();
      } catch {
        throw new BadRequestException(s.label + " must be an HTTP(S) URL");
      }
    }
    if (s.options && !s.options.includes(value))
      throw new BadRequestException("Invalid " + s.label);
    if (
      value &&
      s.type === "number" &&
      (!Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) > 100000000)
    )
      throw new BadRequestException("Invalid " + s.label);
    if (
      value &&
      ["date", "datetime-local"].includes(s.type || "") &&
      (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value.slice(0, 10)).toISOString().slice(0, 10) !==
          value.slice(0, 10))
    )
      throw new BadRequestException("Invalid " + s.label);
    if (value && s.type === "file" && !/^[a-f0-9-]{36}$/.test(value))
      throw new BadRequestException("Invalid file");
    out[s.key] = value;
  }
  return out;
}
export const accountFields = [
  ...new Map(
    [...profileSteps.patient, ...profileSteps.business]
      .flatMap((s) => s.fields)
      .map((f) => [f.key, f]),
  ).values(),
  {
    key: "profileComplete",
    label: "Completion",
    type: "select",
    options: ["yes", "no"],
  },
];
accountFields.push({
  key: "profileStep",
  label: "Profile step",
  type: "select",
  options: ["0", "1", "2", "3", "4"],
});
export async function archiveListing(user: any, id: string, archived: boolean) {
  const result = await db.query(
    `UPDATE providers p SET archived=$1,published=false,verified=false,updated_at=now() WHERE id=$2 AND ($4='admin' OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$3)) RETURNING id`,
    [archived, id, user.id, user.role],
  );
  if (!result.rows[0]) throw new NotFoundException();
  return { success: true };
}
export async function saveProfile(id: string, input: unknown) {
  const values = validateFields(input, accountFields),
    { name, phone, ...profile } = values;
  return (
    await db.query(
      "UPDATE app_users SET name=COALESCE($1,name),phone=COALESCE($2,phone),profile=profile||$3::jsonb,updated_at=now() WHERE id=$4 RETURNING *",
      [name ?? null, phone ?? null, JSON.stringify(profile), id],
    )
  ).rows[0];
}
export async function saveListing(user: any, input: unknown, id?: string) {
  if (!providerKinds.includes(user.role) && user.role !== "admin")
    throw new ForbiddenException("A business account is required");
  const values = validateFields(input, listingFields, !id ? false : true);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (id) {
      const found = await client.query(
        `SELECT p.* FROM providers p WHERE p.id=$1 AND ($3='admin' OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$2)) FOR UPDATE`,
        [id, user.id, user.role],
      );
      if (!found.rows[0]) throw new NotFoundException("Profile not found");
    } else {
      id = randomUUID();
      await client.query("SELECT id FROM app_users WHERE id=$1 FOR UPDATE", [
        user.id,
      ]);
      const count = await client.query(
        "SELECT count(*)::int count FROM provider_memberships WHERE user_id=$1",
        [user.id],
      );
      if (count.rows[0].count >= 100)
        throw new BadRequestException(
          "Please contact support for more than 100 profiles",
        );
      await client.query(
        `INSERT INTO providers(id,slug,name,kind,published,verified) VALUES($1,$2,$3,$4,false,false)`,
        [
          id,
          values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + id,
          values.name,
          values.kind,
        ],
      );
      await client.query(
        "INSERT INTO provider_memberships(provider_id,user_id) VALUES($1,$2)",
        [id, user.id],
      );
    }
    const core = [
      "name",
      "kind",
      "specialty",
      "area",
      "address",
      "phone",
      "website",
      "services",
    ];
    const changes: string[] = [],
      args: any[] = [];
    for (const key of core)
      if (values[key] !== undefined) {
        args.push(
          key === "services"
            ? values[key]
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
                .slice(0, 50)
            : values[key],
        );
        changes.push(`${key}=$${args.length}`);
      }
    const details = Object.fromEntries(
      Object.entries(values).filter(
        ([k]) => !core.includes(k) && k !== "affiliationIds",
      ),
    );
    args.push(JSON.stringify(details));
    changes.push(`details=details||$${args.length}::jsonb`);
    args.push(id);
    const result = await client.query(
      `UPDATE providers SET ${changes.join(",")},published=false,verified=false,updated_at=now() WHERE id=$${args.length} RETURNING *`,
      args,
    );
    if (values.affiliationIds !== undefined) {
      for (const parent of values.affiliationIds) {
        const found = await client.query(
          `SELECT id FROM providers p WHERE id=$1 AND kind IN ('clinic','hospital') AND id<>$2 AND (published OR $4='admin' OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$3))`,
          [parent, id, user.id, user.role],
        );
        if (!found.rows[0])
          throw new BadRequestException(
            "Select an available hospital or clinic",
          );
      }
      await client.query(
        "DELETE FROM provider_affiliations WHERE provider_id=$1",
        [id],
      );
      for (const parent of values.affiliationIds)
        await client.query(
          "INSERT INTO provider_affiliations(provider_id,facility_id) VALUES($1,$2)",
          [id, parent],
        );
    }
    await client.query(
      "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
      [user.id, "provider.profile.saved", id],
    );
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function listListings(
  user: any,
  all = false,
  includeArchived = false,
) {
  return (
    await db.query(
      `SELECT p.*,COALESCE((SELECT jsonb_agg(f.id) FROM provider_affiliations a JOIN providers f ON f.id=a.facility_id WHERE a.provider_id=p.id),'[]') AS "affiliationIds" FROM providers p WHERE ($3 OR NOT p.archived) AND ($2 OR EXISTS(SELECT 1 FROM provider_memberships m WHERE m.provider_id=p.id AND m.user_id=$1)) ORDER BY updated_at DESC LIMIT 500`,
      [user.id, all && user.role === "admin", includeArchived],
    )
  ).rows;
}
export function moduleFor(key: string, user: any, write = false) {
  const m = modules[key];
  if (!m) throw new NotFoundException();
  if (write && !m.roles.includes(user.role))
    throw new ForbiddenException("Your role cannot create these records");
  return m;
}
export async function recordSave(
  key: string,
  user: any,
  input: unknown,
  id?: string,
) {
  const m = moduleFor(key, user, true),
    data = validateFields(input, m.fields, false);
  if (key === "articles" && user.role !== "admin") data.status = "Draft";
  // A patient cannot publish their own review or manufacture completed appointments.
  if (user.role !== "admin" && key === "reviews") data.status = "Pending";
  if (
    user.role === "patient" &&
    key === "appointments" &&
    !["Requested", "Cancelled"].includes(data.status)
  )
    throw new ForbiddenException("Provider confirmation is required");
  if (
    user.role === "patient" &&
    key === "lab_requests" &&
    !["Requested", "Cancelled"].includes(data.status)
  )
    throw new ForbiddenException("Provider confirmation is required");
  if (data.fileId) {
    const owned = await db.query(
      "SELECT id FROM account_files WHERE id=$1 AND (owner_id=$2 OR $3)",
      [data.fileId, user.id, user.role === "admin"],
    );
    if (!owned.rows[0])
      throw new BadRequestException("Upload your own document");
  }
  const result = id
    ? await db.query(
        `UPDATE dashboard_${key} SET data=$1,updated_at=now() WHERE id=$2 AND (owner_id=$3 OR $4) AND NOT archived RETURNING *`,
        [data, id, user.id, user.role === "admin"],
      )
    : await db.query(
        `INSERT INTO dashboard_${key}(id,owner_id,data) VALUES($1,$2,$3) RETURNING *`,
        [randomUUID(), user.id, data],
      );
  if (!result.rows[0]) throw new NotFoundException();
  await db.query(
    "INSERT INTO account_audit(actor_id,action,target_id) VALUES($1,$2,$3)",
    [user.id, key + ".saved", result.rows[0].id],
  );
  return result.rows[0];
}
