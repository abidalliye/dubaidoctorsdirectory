import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { PGlite } from "@electric-sql/pglite";
const require = createRequire(import.meta.url);
test("Connected care persists across roles and rejects unauthorized, duplicate and invalid operations", async () => {
  const pg = await PGlite.create();
  // The care migrations run on PostgreSQL. Geo extension behavior is covered separately on Neon.
  const base = readFileSync("infra/db/001-directory.sql", "utf8")
    .replace("CREATE EXTENSION IF NOT EXISTS postgis;", "")
    .replace("geography(Point,4326)", "text")
    .replace(/CREATE INDEX IF NOT EXISTS providers_location[^;]+;/, "");
  await pg.exec(base);
  for (const file of [
    "002-auth.sql",
    "003-dashboard.sql",
    "004-care-workflows.sql",
    "005-business-details.sql",
  ])
    await pg.exec(readFileSync("infra/db/" + file, "utf8"));
  await pg.exec(readFileSync("infra/db/004-care-workflows.sql", "utf8"));
  process.env.DATABASE_URL = "postgres://isolated-test";
  process.env.WEB_ORIGIN = "http://localhost:14403";
  process.env.NODE_ENV = "development";
  const { db } = require("../apps/api/dist/db.js");
  const originals = { query: db.query, connect: db.connect, end: db.end };
  db.query = (sql, params) => pg.query(sql, params);
  db.connect = async () => ({
    query: (sql, params) => pg.query(sql, params),
    release() {},
  });
  db.end = async () => {};
  const { createApplication } = require("../apps/api/dist/app.js");
  const app = await createApplication();
  await app.listen(14403, "127.0.0.1");
  const sessions = {};
  let serial = 0;
  async function request(who, path, method = "GET", body) {
    const s = sessions[who];
    const r = await fetch("http://127.0.0.1:14403/v1/" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "FertiFind",
        Origin: process.env.WEB_ORIGIN,
        ...(s ? { Cookie: s.cookie, "X-CSRF-Token": s.csrf } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    return { status: r.status, data, headers: r.headers };
  }
  async function register(role) {
    const who = role + ++serial;
    const r = await request(null, "auth/register", "POST", {
      name: "Test " + who,
      email: who + "@example.invalid",
      password: "Local-test-password-123!",
      role,
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    const cookies = r.headers.getSetCookie().map((c) => c.split(";")[0]);
    sessions[who] = {
      cookie: cookies.join("; "),
      csrf: cookies.find((c) => c.startsWith("ff_csrf=")).slice(8),
      user: r.data.user,
    };
    return who;
  }
  const ok = async (...args) => {
    const r = await request(...args);
    assert.ok(r.status < 300, JSON.stringify(r.data));
    return r.data;
  };
  try {
    const patient = await register("patient"),
      stranger = await register("patient"),
      doctor = await register("doctor"),
      lab = await register("lab"),
      admin = await register("doctor");
    await pg.query(
      `UPDATE app_users SET role='admin',status='active',email_verified=true WHERE id=$1`,
      [sessions[admin].user.id],
    );
    await ok(admin, "admin/users/" + sessions[doctor].user.id, "PATCH", {
      status: "active",
    });
    await ok(admin, "admin/users/" + sessions[lab].user.id, "PATCH", {
      status: "active",
    });
    // Account approval intentionally revokes existing sessions. Sign in again
    // through the public endpoint instead of manufacturing a session.
    for (const who of [doctor, lab]) {
      const login = await request(null, "auth/login", "POST", {
        email: who + "@example.invalid",
        password: "Local-test-password-123!",
      });
      assert.equal(login.status, 201, JSON.stringify(login.data));
      const cookies = login.headers.getSetCookie().map((c) => c.split(";")[0]);
      sessions[who] = {
        cookie: cookies.join("; "),
        csrf: cookies.find((c) => c.startsWith("ff_csrf=")).slice(8),
        user: login.data.user,
      };
    }
    // Blog drafts, uploaded covers, moderation, ownership and public visibility.
    const cover=await ok(doctor,'dashboard/files','POST',{name:'cover.png',type:'image/png',content:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS9sAAAAASUVORK5CYII='});
    const postData={title:'Preview article',author:'Test author',body:'## A heading\n\nA **formatted** paragraph.',excerpt:'Short summary',category:'Healthy Living',tags:'wellbeing',imageId:cover.id,imageAlt:'Test cover',featured:'yes',status:'Draft'};
    const post=(await ok(doctor,'dashboard/records/articles','POST',postData)).record;
    assert.equal((await request(null,'content/articles/'+post.id+'/image')).status,404);
    assert.ok(!(await ok(null,'content/articles')).items.some(p=>p.id===post.id));
    assert.equal((await request(lab,'dashboard/records/articles/'+post.id,'PATCH',{...postData,imageId:''})).status,404);
    assert.equal((await request(patient,'dashboard/records/articles','POST',postData)).status,403);
    assert.equal((await request(lab,'dashboard/records/articles','POST',postData)).status,400);
    const submitted=(await ok(doctor,'dashboard/records/articles/'+post.id,'PATCH',{...postData,status:'Published'})).record;
    assert.equal(submitted.data.status,'Pending');
    assert.ok(!(await ok(null,'content/articles')).items.some(p=>p.id===post.id));
    await ok(admin,'dashboard/records/articles/'+post.id,'PATCH',{...postData,status:'Published'});
    assert.ok((await ok(null,'content/articles')).items.some(p=>p.id===post.id&&p.data.excerpt==='Short summary'));
    const publicCover=await fetch('http://127.0.0.1:14403/v1/content/articles/'+post.id+'/image');
    assert.equal(publicCover.status,200);assert.equal(publicCover.headers.get('content-type'),'image/png');assert.ok((await publicCover.arrayBuffer()).byteLength>0);
    await ok(admin,'dashboard/records/articles/'+post.id,'PATCH',postData);
    assert.equal((await request(null,'content/articles/'+post.id+'/image')).status,404);
    await ok(admin,'dashboard/records/articles/'+post.id+'/archive','POST',{});
    await ok(patient, "account/profile", "PATCH", {
      phone: "+971500000001",
      area: "Dubai",
      medicalHistory: "Private test detail",
    });
    assert.equal(
      (await ok(patient, "account/profile")).user.profile.medicalHistory,
      "Private test detail",
    );
    const provider = (
      await ok(doctor, "account/providers", "POST", {
        name: "Independent Test Doctor",
        kind: "doctor",
        area: "Dubai",
        affiliationIds: [],
      })
    ).provider;
    const laboratory = (
      await ok(lab, "account/providers", "POST", {
        name: "Independent Test Lab",
        kind: "lab",
        affiliationIds: [],
      })
    ).provider;
    await ok(admin, "admin/providers/" + provider.id, "PATCH", {
      published: true,
    });
    await ok(admin, "admin/providers/" + laboratory.id, "PATCH", {
      published: true,
    });
    const businessPath = "care/providers/" + provider.id;
    const hours = (await ok(doctor, businessPath + "/hours", "POST", {
      weekday: "1", opens: "09:00", closes: "17:00",
    })).record;
    await ok(doctor, businessPath + "/licenses", "POST", {
      authority: "DHA", licenseNumber: "TEST-123", expiresOn: "2028-12-31", qualification: "Test qualification",
    });
    await ok(doctor, businessPath + "/branches", "POST", {
      name: "Independent branch", city: "Dubai", address: "Test address", latitude: "25.20", longitude: "55.27",
    });
    const details = await ok(doctor, businessPath + "/details");
    assert.equal(details.hours.length, 1);
    assert.equal(details.licenses[0].license_number, "TEST-123");
    assert.equal(details.branches[0].name, "Independent branch");
    assert.equal((await request(stranger, businessPath + "/hours", "POST", {
      weekday: "2", opens: "09:00", closes: "17:00",
    })).status, 404);
    assert.equal((await request(doctor, businessPath + "/hours", "POST", {
      weekday: "1", opens: "17:00", closes: "09:00",
    })).status, 400);
    await ok(doctor, businessPath + "/details/hours/" + hours.id + "/remove", "POST", {});
    assert.equal((await ok(doctor, businessPath + "/details")).hours.length, 0);
    await ok(doctor, businessPath + "/team", "POST", {
      email: lab + "@example.invalid", permission: "billing",
    });
    assert.equal((await request(lab, businessPath + "/branches", "POST", {
      name: "Denied", city: "Dubai", address: "Denied",
    })).status, 404);
    await ok(doctor, businessPath + "/team/" + sessions[lab].user.id + "/remove", "POST", {});
    assert.equal((await request(doctor, businessPath + "/team", "POST", {
      email: patient + "@example.invalid", permission: "manager",
    })).status, 400);
    const service = (
      await ok(doctor, "care/services", "POST", {
        providerId: provider.id,
        name: "Consultation",
        price: "125.50",
        duration: "30",
        mode: "In clinic",
      })
    ).record;
    assert.equal(
      (
        await request(stranger, "care/services", "POST", {
          providerId: provider.id,
          name: "Intrusion",
          price: "1",
          duration: "30",
          mode: "In clinic",
        })
      ).status,
      404,
    );
    const start = new Date(Date.now() + 86400000).toISOString();
    const slot = (
      await ok(doctor, "care/slots", "POST", {
        serviceId: service.id,
        startsAt: start,
      })
    ).record;
    const dependent = (
      await ok(patient, "care/dependents", "POST", {
        name: "Child Test",
        birthDate: "2020-01-01",
        relationship: "Child",
      })
    ).record;
    const summaryPath='care/public/provider-summaries?ids='+encodeURIComponent(provider.id+','+laboratory.id);
    const publicSummary=(await ok(null,summaryPath)).items.find(p=>p.id===provider.id);
    assert.equal(publicSummary.price_minor,12550);
    assert.deepEqual(publicSummary.modes,['In clinic']);
    assert.ok(publicSummary.next_slot);
    assert.equal(publicSummary.review_count,0);
    assert.equal(publicSummary.rating,null);
    assert.equal((await ok(null,'providers?maxFee=125&kind=doctor')).total,0);
    assert.equal((await ok(null,'providers?maxFee=126&kind=doctor&mode=In%20clinic&available=true')).total,1);
    assert.equal((await ok(null,'providers?mode=Home%20visit')).total,0);
    for(const filter of ['maxFee=-1','maxFee=NaN','mode=Unknown','available=yes'])assert.equal((await request(null,'providers?'+filter)).status,400);
    assert.equal((await request(patient,'care/appointments')).headers.get('cache-control'),'no-store');
    assert.equal(
      (
        await request(stranger, "care/appointments", "POST", {
          slotId: slot.id,
          dependentId: dependent.id,
        })
      ).status,
      404,
    );
    const a = (
      await ok(patient, "care/appointments", "POST", {
        slotId: slot.id,
        dependentId: dependent.id,
        reason: "Test reason",
        insurance: "Test plan",
      })
    ).record;
    assert.equal(a.price_minor, 12550);
    assert.equal(a.patient_name, "Child Test");
    assert.equal((await ok(null,summaryPath)).items.find(p=>p.id===provider.id).next_slot,null);
    assert.equal((await ok(null,'providers?available=true&kind=doctor')).total,0);
    assert.equal(
      (
        await request(stranger, "care/appointments", "POST", {
          slotId: slot.id,
        })
      ).status,
      409,
    );
    assert.equal((await ok(doctor, "care/appointments")).items[0].id, a.id);
    assert.equal((await ok(stranger, "care/appointments")).items.length, 0);
    assert.equal(
      (
        await request(patient, "care/appointments/" + a.id, "PATCH", {
          status: "Confirmed",
        })
      ).status,
      409,
    );
    await ok(doctor, "care/appointments/" + a.id, "PATCH", {
      status: "Confirmed",
    });
    const second = (
      await ok(doctor, "care/slots", "POST", {
        serviceId: service.id,
        startsAt: new Date(Date.now() + 172800000).toISOString(),
      })
    ).record;
    await ok(patient, "care/appointments/" + a.id + "/reschedule", "POST", {
      slotId: second.id,
    });
    assert.equal(
      (await ok(patient, "care/appointments")).items[0].status,
      "Requested",
    );
    const draft = (
      await ok(doctor, "care/records", "POST", {
        appointmentId: a.id,
        kind: "note",
        title: "Private Draft",
        body: "Not released",
        status: "Draft",
      })
    ).record;
    assert.equal((await ok(patient, "care/records")).items.length, 0);
    await ok(doctor, "care/records/" + draft.id, "PATCH", {
      status: "Released",
    });
    assert.equal(
      (await ok(patient, "care/records")).items[0].body,
      "Not released",
    );
    assert.equal(
      (
        await request(stranger, "care/records", "POST", {
          appointmentId: a.id,
          kind: "message",
          title: "Intrusion",
          body: "Unauthorized",
        })
      ).status,
      404,
    );
    const order = (
      await ok(doctor, "care/records", "POST", {
        appointmentId: a.id,
        kind: "lab_order",
        title: "Blood Test",
        body: "Requested test",
        labProviderId: laboratory.id,
      })
    ).record;
    const labRecords = (await ok(lab, "care/records")).items;
    assert.equal(labRecords.length, 1);
    assert.equal(labRecords[0].id, order.id);
    for (const status of ["Accepted", "Collected", "Processing"])
      await ok(lab, "care/records/" + order.id, "PATCH", { status });
    const report = (
      await ok(lab, "care/lab-reports/" + order.id, "POST", {
        title: "Test Report",
        body: "Test results only",
      })
    ).record;
    assert.ok(
      (await ok(patient, "care/records")).items.some((r) => r.id === report.id),
    );
    assert.equal((await ok(stranger, "care/records")).items.length, 0);
    const invoice = (await ok(patient, "care/invoices")).items[0];
    assert.equal(
      (
        await request(patient, "care/invoices/" + invoice.id, "PATCH", {
          method: "Cash",
        })
      ).status,
      403,
    );
    await ok(doctor, "care/invoices/" + invoice.id, "PATCH", {
      method: "Cash",
    });
    assert.equal((await ok(patient, "care/invoices")).items[0].status, "Paid");
    const patientMetrics=await ok(patient,'care/dashboard-metrics');
    assert.equal(patientMetrics.people.providers,1);
    assert.equal(patientMetrics.revenue.reduce((n,r)=>n+r.amount,0),invoice.amount_minor);
    const strangerMetrics=await ok(stranger,'care/dashboard-metrics');
    assert.equal(strangerMetrics.people.providers,0);
    assert.equal(strangerMetrics.records.length,0);
    assert.equal(strangerMetrics.revenue.length,0);
    assert.equal((await request(patient,'care/dashboard-metrics?from=2026-02-30')).status,400);
    assert.equal((await request(patient,'care/dashboard-metrics?from=2026-12-01&to=2026-01-01')).status,400);
    assert.equal((await ok(patient,'care/dashboard-metrics?from=2000-01-01&to=2000-01-02')).revenue.length,0);
    assert.equal((await request(null,'care/dashboard-metrics')).status,401);
    assert.equal(
      (
        await request(doctor, "care/invoices/" + invoice.id, "PATCH", {
          method: "Cash",
        })
      ).status,
      409,
    );
    const insights = await ok(admin, "care/admin-insights");
    assert.equal(insights.revenueTrend.reduce((sum,r)=>sum+r.amount,0),invoice.amount_minor);
    assert.ok(insights.bookingTrend.some(r=>r.count>0));
    assert.equal((await request(patient,"care/admin-insights")).status,403);
    assert.equal((await request(doctor,"care/admin-insights")).status,403);
    assert.equal((await request(admin,"care/admin-insights?from=2026-02-30")).status,400);
    assert.equal((await request(admin,"care/admin-insights?from=2026-10-03&to=2026-01-01")).status,400);
    const excluded = await ok(admin,"care/admin-insights?from=2000-01-01&to=2000-01-02");
    assert.equal(excluded.bookingTrend.length,0);
    assert.equal(excluded.revenueTrend.length,0);
    await ok(patient, "care/favorites", "POST", {
      providerId: provider.id,
      saved: true,
    });
    assert.equal(
      (await ok(patient, "care/favorites")).items[0].id,
      provider.id,
    );
    assert.equal(
      (
        await request(stranger, "care/reviews", "POST", {
          appointmentId: a.id,
          rating: "5",
          comment: "Fake",
        })
      ).status,
      404,
    );
    const claim = (
      await ok(lab, "care/claims", "POST", {
        providerId: provider.id,
        evidence: "Test ownership claim",
      })
    ).record;
    assert.equal(
      (
        await request(lab, "care/claims/" + claim.id, "PATCH", {
          status: "Approved",
        })
      ).status,
      403,
    );
    await ok(admin, "care/claims/" + claim.id, "PATCH", { status: "Rejected" });
    const notices = (await ok(patient, "care/notifications")).items;
    assert.ok(notices.length >= 3);
    await ok(patient, "care/notifications/" + notices[0].id, "PATCH", {});
    assert.equal(
      (
        await request(
          stranger,
          "care/notifications/" + notices[0].id,
          "PATCH",
          {},
        )
      ).status,
      404,
    );
    await ok(patient, "care/appointments/" + a.id, "PATCH", {
      status: "Cancelled",
    });
    assert.equal(
      (await ok(doctor, "care/appointments")).items[0].status,
      "Cancelled",
    );
    assert.equal(
      (
        await request(patient, "care/appointments/" + a.id, "PATCH", {
          status: "Requested",
        })
      ).status,
      409,
    );
  } finally {
    await app.close();
    Object.assign(db, originals);
    await pg.close();
  }
});
