"use client";
import Link from "next/link";
import {Icon} from "./icon";
import { useCallback, useEffect, useState } from "react";
import { api, formatMoney, localTime, User } from "../lib/client-api";
import {useBrand} from './brand-context';
import { Avatar } from "./provider-card";
import { Fields, Modal, ProfileWizard, Field } from "./forms";
import { ListingWizard } from "./listing-wizard";
import { AdminNavigation } from "./admin-navigation";
import { RoleOverview } from "./role-overview";
import { AdminOverview } from "./admin-overview";
import { BlogWorkspace } from "./blog-workspace";
import { BusinessDetails } from "./business-details";
const badge = (s: string) => (
  <span
    className={`badge ${["Requested", "Pending", "Draft", "Issued"].includes(s) ? "pending" : ["Cancelled", "Rejected", "Hidden"].includes(s) ? "cancelled" : ""}`}
  >
    {s}
  </span>
);
const f = (
  key: string,
  label: string,
  type = "text",
  required = false,
  options?: string[],
): Field => ({ key, label, type, required, options });
const careKeys = [
  "appointments",
  "records",
  "invoices",
  "services",
  "slots",
  "dependents",
  "favorites",
  "reviews",
  "notifications",
  "claims",
];
export function Dashboard() {
  const brand=useBrand();
  const [user, setUser] = useState<User | null>(null),
    [schema, setSchema] = useState<any>(null),
    [tab, setTab] = useState("overview"),
    [data, setData] = useState<Record<string, any[]>>({}),
    [providers, setProviders] = useState<any[]>([]),
    [facilities, setFacilities] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [profile, setProfile] = useState(false),
    [adminProfile, setAdminProfile] = useState<User | null>(null),
    [listing, setListing] = useState<any>(null),
    [details, setDetails] = useState<any>(null),
    [editor, setEditor] = useState<any>(null),
    [values, setValues] = useState<Record<string, any>>({}),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [providerKind, setProviderKind] = useState(""),
    [mobile, setMobile] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [toast, setToast] = useState("");
  const [overview,setOverview]=useState<any>(null);
  const [newPost,setNewPost]=useState(false);
  useEffect(()=>{const q=new URLSearchParams(window.location.search);if(q.get('tab')==='posts'){setTab('cms:articles');setNewPost(q.get('new')==='1')}},[]);
  useEffect(()=>{let active=true;setOverview(null);if(user)api('care/overview?'+new URLSearchParams({from,to})).then(r=>{if(active)setOverview(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[user,from,to,data.appointments]);
  const load = useCallback(async () => {
    setError("");
    try {
      const u = (await api("auth/me")).user;
      setUser(u);
      const initial = await Promise.allSettled([
        api("dashboard/schema"),
        api(u.role === "admin" ? "admin/providers" : "account/providers"),
        api("dashboard/facilities"),
        ...careKeys.map((k) => api("care/" + k)),
        ...(u.role === "admin" ? [api("admin/users")] : []),
      ]);
      const errors: string[] = [];
      initial.forEach((r, i) => {
        if (r.status === "rejected") {
          errors.push(r.reason.message);
          return;
        }
        if (i === 0) setSchema(r.value);
        else if (i === 1) setProviders(r.value.items);
        else if (i === 2) setFacilities(r.value.items);
        else
          setData((old) => ({
            ...old,
            [i < 3 + careKeys.length ? careKeys[i - 3] : "users"]:
              r.value.items,
          }));
      });
      if (errors.length) setError([...new Set(errors)].join(" · "));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (
      user &&
      user.role !== 'admin' &&
      schema &&
      user.profile?.profileComplete !== "yes" &&
      !sessionStorage.getItem("careatlas-profile-prompt")
    ) {
      sessionStorage.setItem("careatlas-profile-prompt", "shown");
      setProfile(true);
    }
  }, [user, schema]);
  useEffect(() => {
    if (!schema || !user) return;
    if (tab.startsWith("cms:"))
      api("dashboard/records/" + tab.slice(4))
        .then((r) => setData((old) => ({ ...old, [tab]: r.items })))
        .catch((e) => setError(e.message));
    if (tab === "settings")
      api("admin/settings")
        .then((r) => setValues(r.settings || r.data || {}))
        .catch((e) => setError(e.message));
  }, [tab, schema, user]);
  async function action(path: string, body: any, method = "PATCH") {
    setBusy(true);
    setError("");
    try {
      await api(path, method, body);
      setToast("Saved successfully");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function open(kind: string, row?: any) {
    if(kind==='cms:articles'&&!row){setTab('cms:articles');setNewPost(true);return}
    let fields: Field[] = [];
    let opts: Record<string, any[]> = {};
    let path = "care/" + kind;
    let initial: any = {};
    if (kind === "services") {
      fields = [
        f("providerId", "Provider", "select", true),
        f("name", "Service name", "text", true),
        f("price", "Price AED", "number", true),
        f("duration", "Duration minutes", "number", true),
        f("mode", "Consultation mode", "select", true, [
          "In clinic",
          "Home visit",
        ]),
        f("description", "Service description", "textarea"),
        f("preparation", "Preparation", "textarea"),
      ];
      if (row) {
        path = "care/services/" + row.id;
        fields = fields.filter((f) => f.key !== "providerId");
        initial = {
          name: row.name,
          description: row.description,
          price: String(row.price_minor / 100),
          duration: String(row.duration_minutes),
          mode: row.mode,
          preparation: row.preparation,
        };
      } else {
        opts.providerId = providers.map((p) => ({
          value: p.id,
          label: p.name,
        }));
        initial = { duration: "30", mode: "In clinic" };
      }
    } else if (kind === "slots") {
      fields = [
        f("serviceId", "Service", "select", true),
        f("startsAt", "Start time", "datetime-local", true),
      ];
      opts.serviceId = (data.services || [])
        .filter((s) => s.active)
        .map((s) => ({ value: s.id, label: s.name + " · " + s.provider_name }));
    } else if (kind === "dependents") {
      fields = [
        f("name", "Full name", "text", true),
        f("birthDate", "Birth date", "date"),
        f("relationship", "Relationship", "select", true, [
          "Child",
          "Spouse",
          "Parent",
          "Other",
        ]),
      ];
      if (row) {
        path = "care/dependents/" + row.id;
        initial = {
          name: row.name,
          birthDate: row.birth_date?.slice(0, 10) || "",
          relationship: row.relationship,
        };
      }
    } else if (kind === "reschedule") {
      path = "care/appointments/" + row.id + "/reschedule";
      fields = [f("slotId", "Choose slot", "select", true)];
      opts.slotId = [];
      api("care/public/slots/" + row.service_id)
        .then((r) =>
          setEditor((old: any) =>
            old?.kind === "reschedule"
              ? {
                  ...old,
                  opts: {
                    slotId: r.items.map((s: any) => ({
                      value: s.id,
                      label: localTime(s.starts_at),
                    })),
                  },
                }
              : old,
          ),
        )
        .catch((e) => setError(e.message));
    } else if (kind === "records") {
      fields = [
        f("appointmentId", "Appointment", "select", true),
        f(
          "kind",
          "Record type",
          "select",
          true,
          ['doctor','surgeon','admin'].includes(user?.role || '')
            ? ["note", "prescription", "lab_order", "report", "message"]
            : user?.role === 'lab' ? ['note','report','message'] : ["message"],
        ),
        f("title", "Title", "text", true),
        f("body", "Details", "textarea", true),
        f("labProviderId", "Laboratory", "select"),
        f("fileId", "Attach file", "file"),
        f("status", "Publication", "select", false, ["Draft", "Released"]),
      ];
      opts.appointmentId = (data.appointments || []).map((a) => ({
        value: a.id,
        label:
          a.patient_name +
          " · " +
          a.provider_name +
          " · " +
          localTime(a.starts_at),
      }));
      initial = {
        kind: user?.role === "patient" ? "message" : "note",
        status: "Draft",
      };
      api("providers?kind=lab&limit=50").then((r) =>
        setEditor((old: any) =>
          old
            ? {
                ...old,
                opts: {
                  ...old.opts,
                  labProviderId: r.items.map((p: any) => ({
                    value: p.id,
                    label: p.name,
                  })),
                },
              }
            : old,
        ),
      );
    } else if (kind === "lab-reports") {
      fields = [
        f("order", "Lab order", "select", true),
        f("title", "Report title", "text", true),
        f("body", "Results", "textarea", true),
        f("fileId", "Report file", "file"),
      ];
      opts.order = (data.records || [])
        .filter(
          (r) =>
            r.kind === "lab_order" &&
            ["Processing", "Completed"].includes(r.status),
        )
        .map((r) => ({ value: r.id, label: r.patient_name + " · " + r.title }));
    } else if (kind === "reviews") {
      fields = [
        f("appointmentId", "Appointment", "select", true),
        f("rating", "Rating", "select", true, ["1", "2", "3", "4", "5"]),
        f("comment", "Your review", "textarea", true),
      ];
      opts.appointmentId = (data.appointments || [])
        .filter((a) => a.patient_id === user?.id && a.status === "Completed")
        .map((a) => ({
          value: a.id,
          label: a.provider_name + " · " + localTime(a.starts_at),
        }));
    } else if (kind === "invoices") {
      path = "care/invoices/" + row.id;
      fields = [
        f("method", "Received payment", "select", true, [
          "Cash",
          "Bank transfer",
        ]),
      ];
    } else if (kind === "users") {
      path = "admin/users/" + row.id;
      fields = [
        f("role", "Role", "select", true, schema.roles),
        f("status", "Account status", "select", true, [
          "active",
          "pending",
          "disabled",
        ]),
      ];
      initial = { role: row.role, status: row.status };
    } else if (kind.startsWith("cms:")) {
      const key = kind.slice(4);
      path = "dashboard/records/" + key + (row ? "/" + row.id : "");
      fields = schema.modules[key].fields;
      initial = row?.data || {};
    }
    setValues(initial);
    setEditor({
      kind,
      row,
      fields,
      opts,
      path,
      method: row && kind !== "reschedule" ? "PATCH" : "POST",
    });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!editor) return;
    setBusy(true);
    setError("");
    try {
      const body = { ...values };
      let path = editor.path;
      if (editor.kind === "slots")
        body.startsAt = new Date(
          String(body.startsAt) + "+04:00",
        ).toISOString();
      if (editor.kind === "lab-reports") {
        path = "care/lab-reports/" + body.order;
        delete body.order;
      }
      Object.keys(editor.opts).forEach((k) => {
        if (body[k] === "") delete body[k];
      });
      await api(path, editor.method, body);
      setEditor(null);
      setToast("Record saved to database");
      await load();
      if (tab.startsWith("cms:")) setData((old) => ({ ...old, [tab]: [] }));
      if (tab.startsWith("cms:")) {
        const r = await api("dashboard/records/" + tab.slice(4));
        setData((old) => ({ ...old, [tab]: r.items }));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main className="container section">
        <div className="card">Loading your dashboard…</div>
      </main>
    );
  if (!user)
    return (
      <main className="container section">
        <div className="card">
          <h1>Sign in to your dashboard</h1>
          <p className="error">{error}</p>
          <Link className="button" href={'/auth?next='+encodeURIComponent('/dashboard'+(tab==='cms:articles'?'?tab=posts'+(newPost?'&new=1':''):''))}>
            Sign In
          </Link>
        </div>
      </main>
    );
  const business = user.role !== "patient",
    admin = user.role === "admin";
  const menus = [
    ["overview", "⌂", "Dashboard"],
    ["profile", "♙", "My Profile"],
    ...(business
      ? [
          ["providers", "▥", "Business Listings"],
          ["services", "✚", "Services & Tests"],
          ["slots", "▦", "Availability"],
        ]
      : [
          ["dependents", "♧", "Family Profiles"],
          ["favorites", "♡", "Saved Providers"],
        ]),
    ["appointments", "▦", "Appointments"],
    ["records", "▤", "Care Records & Messages"],
    ["invoices", "▣", "Invoices & Payments"],
    ["reviews", "☆", "Reviews"],
    ["notifications", "♧", "Notifications"],
    ...(business ? [["claims", "✓", "Listing Claims"]] : []),
    ...(admin
      ? [
          ["users", "♙", "Users"],
          ["settings", "⚙", "Settings"],
        ]
      : []),
  ];
  const cms = Object.entries(schema?.modules || {}).filter(
    ([key, m]: any) =>
      ![
        "appointments",
        "reviews",
        "payments",
        "notes",
        "prescriptions",
        "lab_requests",
        "documents",
        "schedules",
        "saved_providers",
        "patients",
        "tariffs",
      ].includes(key) && m.roles.includes(user.role),
  );
  const appointments = (data.appointments || []).filter(
    (a) =>
      (!from || new Date(a.starts_at).toLocaleDateString('en-CA',{timeZone:'Asia/Dubai'}) >= from) &&
      (!to || new Date(a.starts_at).toLocaleDateString('en-CA',{timeZone:'Asia/Dubai'}) <= to),
  );
  const invoices = data.invoices || [];
  const filtered = (data[tab] || []).filter((r) =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );
  const counts = overview?Object.fromEntries(overview.listingKinds.map((g:any)=>[g.kind,g.count])):providers.reduce(
    (out: Record<string, number>, p) => ({
      ...out,
      [p.kind]: (out[p.kind] || 0) + 1,
    }),
    {},
  );
  const palette = [
    "#0877ff",
    "#00b5de",
    "#fb5792",
    "#ffad40",
    "#885ce8",
    "#00a77f",
  ];
  let offset = 0;
  const total = Object.values(counts).reduce((sum:number,n:any)=>sum+Number(n),0);
  const gradient = Object.values(counts)
    .map((n: any, i) => {
      const start = offset;
      offset += (n / (total || 1)) * 100;
      return `${palette[i % palette.length]} ${start}% ${offset}%`;
    })
    .join(",");
  const rows = (
    items: any[],
    columns: [string, (r: any) => React.ReactNode][],
  ) =>
    !items.length ? (
      <div className="empty">No records yet.</div>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map(([title]) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={r.id || i}>
                {columns.map(([title, render]) => (
                  <td key={title}>{render(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  const appointmentColumns: [string, (r: any) => React.ReactNode][] = [
    ["Patient", (a) => a.patient_name],
    ["Provider", (a) => a.provider_name],
    ["Service", (a) => a.service_name],
    ["Date & Time", (a) => localTime(a.starts_at)],
    ["Status", (a) => badge(a.status)],
    [
      "Actions",
      (a) => (
        <div className="row">
          {["Requested", "Confirmed"].includes(a.status) && (
            <button
              className="table-action"
              disabled={busy}
              onClick={() => open("reschedule", a)}
            >
              Reschedule
            </button>
          )}
          {["Requested", "Confirmed"].includes(a.status) && (
            <button
              disabled={busy}
              className="table-action danger"
              onClick={() =>
                action("care/appointments/" + a.id, { status: "Cancelled" })
              }
            >
              Cancel
            </button>
          )}
          {(admin || a.patient_id !== user.id) && a.status === "Requested" && (
            <>
              <button
                className="table-action"
                disabled={busy}
                onClick={() =>
                  action("care/appointments/" + a.id, { status: "Confirmed" })
                }
              >
                Confirm
              </button>
              <button
                className="table-action danger"
                disabled={busy}
                onClick={() =>
                  action("care/appointments/" + a.id, { status: "Rejected" })
                }
              >
                Reject
              </button>
            </>
          )}
          {(admin || a.patient_id !== user.id) && a.status === "Confirmed" && (
            <button
              className="table-action"
              disabled={busy}
              onClick={() =>
                action("care/appointments/" + a.id, { status: "Completed" })
              }
            >
              Complete
            </button>
          )}
          <Link className="link" href={`/appointments/${a.id}/confirmation`}>
            Details
          </Link>
        </div>
      ),
    ],
  ];
  return (
    <div className={`dashboard ${admin ? "admin-dashboard" : "role-dashboard"}`}>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link className="brand" href="/">
          <span className="brand-mark"><Icon name="heart" size={30}/></span>
          <span>
            {brand}
            <small>Healthcare Directory</small>
          </span>
        </Link>
        {admin && <AdminNavigation active={tab} kind={providerKind} onSelect={(key,kind="")=>{if(key==='blog:new'){setTab('cms:articles');setNewPost(true)}else setTab(key);setProviderKind(kind);setQuery('');setMobile(false)}}/>}
        {!admin && <><div className="menu-heading">{user.role} workspace</div>
        {menus.map(([key, icon, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => {
              setTab(key);
              setQuery("");
              setMobile(false);
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
        {!!cms.length && (
          <div className="menu-heading">Content & Operations</div>
        )}
        {cms.map(([key, m]: any) => (
          <button
            key={key}
            className={tab === "cms:" + key ? "active" : ""}
            onClick={() => {
              setTab("cms:" + key);
              setMobile(false);
            }}
          >
            <span>▤</span>
            {m.label}
          </button>
        ))}
        </>}
        <a className="menu-link" href="/">
          ↗ View Website
        </a>
        <button
          onClick={async () => {
            await api("auth/logout", "POST", {});
            location.assign("/auth");
          }}
        >
          ⇥ Sign Out
        </button>
      </aside>
      <div className="dashboard-body">
        <header className="dashboard-top">
          <button
            className="mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            ☰
          </button>
          <input
            className="field"
            aria-label="Search current records"
            placeholder="Search current records"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="row">
            <Link className="button secondary small" href="/">
              View Website ↗
            </Link>
            <button
              className="table-action"
              aria-label="Notifications"
              onClick={() => setTab("notifications")}
            >
              ♧ {(data.notifications || []).filter((n) => !n.read_at).length}
            </button>
            <Avatar name={user.name} />
            <div>
              <strong>{user.name}</strong>
              <small style={{ display: "block" }}>
                {admin ? "Administrator" : user.role}
              </small>
            </div>
          </div>
        </header>
        <main className="dashboard-main">
          <div className="dashboard-heading row spread">
            <div>
              <h1>
                {tab === "overview"
                  ? admin ? "Dashboard" : `Welcome back, ${user.name}!`
                  : tab.startsWith("cms:")
                    ? schema.modules[tab.slice(4)].label
                    : menus.find((m) => m[0] === tab)?.[2]}
              </h1>
              <p>
                Welcome back, {user.name}. Manage your healthcare workspace.
              </p>
            </div>
            <div className="row">
              {tab === "overview" && (
                <>
                  <input
                    className="field"
                    style={{ width: 150 }}
                    type="date"
                    aria-label="From date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                  <input
                    className="field"
                    style={{ width: 150 }}
                    type="date"
                    aria-label="To date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </>
              )}
              <button className="button small" onClick={() => setProfile(true)}>
                {user.profile.profileComplete==='yes'?'Update Profile':'Complete Profile'}
              </button>
            </div>
          </div>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {toast && (
            <div className="success" role="status">
              {toast}
            </div>
          )}
          {user.status === "pending" && (
            <div className="status-strip">
              Your business account awaits administrator approval. You can
              prepare your profile and listing drafts.
            </div>
          )}
          {tab === "overview" && admin && <AdminOverview overview={overview} appointments={appointments.filter(a=>JSON.stringify(a).toLowerCase().includes(query.toLowerCase()))} from={from} to={to} refresh={data.appointments} onTab={setTab} onListing={(kind)=>setListing({kind})} onPost={()=>open("cms:articles")}/> }
          {tab === "overview" && !admin && <RoleOverview user={user} data={data} overview={overview} appointments={appointments} from={from} to={to} onTab={setTab} onProfile={()=>setProfile(true)} onAdd={open} onListing={()=>setListing({})}/>}
          {tab === "profile" && (
            <section className="card">
              <div className="row">
                <Avatar name={user.name} large />
                <div>
                  <h2>{user.name}</h2>
                  <p className="muted">
                    {user.email} · {user.role}
                  </p>
                </div>
              </div>
              <div className="detail-grid" style={{ marginTop: 20 }}>
                {Object.entries({ phone: user.phone, ...user.profile })
                  .filter(
                    ([k, v]) =>
                      v && !["profileStep", "profileComplete"].includes(k),
                  )
                  .map(([k, v]) => (
                    <div className="detail-item" key={k}>
                      <small>{k.replace(/([A-Z])/g, " $1")}</small>
                      <p>{v}</p>
                    </div>
                  ))}
              </div>
              <button
                className="button"
                style={{ marginTop: 20 }}
                onClick={() => setProfile(true)}
              >
                Edit My Profile
              </button>
            </section>
          )}
          {tab === "providers" && !details && (
            <section className="card">
              <div className="card-head">
                <h3>Independent and affiliated listings</h3>
                <button className="button small" onClick={() => setListing({})}>
                  + Add Listing
                </button>
              </div>
              {rows(
                providers.filter((p) =>
                  (!providerKind || p.kind===providerKind) && JSON.stringify(p).toLowerCase().includes(query.toLowerCase()),
                ),
                [
                  ["Name", (p) => p.name],
                  ["Type", (p) => p.kind],
                  ["Area", (p) => p.area],
                  ["Status", (p) => badge(p.published ? "Published" : "Draft")],
                  [
                    "Actions",
                    (p) => (
                      <div className="row">
                        <button
                          className="table-action"
                          onClick={() => setListing(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="table-action"
                          onClick={() => setDetails(p)}
                        >
                          Business Details
                        </button>
                        {admin && (
                          <>
                            <button
                              disabled={busy}
                              className="table-action"
                              onClick={() =>
                                action("admin/providers/" + p.id, {
                                  published: !p.published,
                                })
                              }
                            >
                              {p.published ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              disabled={busy}
                              className="table-action"
                              onClick={() =>
                                action("admin/providers/" + p.id, {
                                  verified: !p.verified,
                                })
                              }
                            >
                              {p.verified ? "Unverify" : "Verify"}
                            </button>
                          </>
                        )}
                        <button
                          disabled={busy}
                          className="table-action danger"
                          onClick={() =>
                            action(
                              "account/providers/" + p.id + "/archive",
                              { archived: true },
                              "POST",
                            )
                          }
                        >
                          Archive
                        </button>
                        {p.published && (
                          <Link className="link" href={"/providers/" + p.slug}>
                            View
                          </Link>
                        )}
                      </div>
                    ),
                  ],
                ],
              )}
            </section>
          )}
          {tab === "appointments" && (
            <section className="card">
              <div className="card-head">
                <h3>Your shared appointments</h3>
                <Link className="button small" href="/directory">
                  + Book Appointment
                </Link>
              </div>
              {rows(filtered, appointmentColumns)}
            </section>
          )}
          {tab === "services" && (
            <section className="card">
              <div className="card-head">
                <h3>Service & Test Catalog</h3>
                <button
                  className="button small"
                  onClick={() => open("services")}
                >
                  + Add Service
                </button>
              </div>
              {rows(filtered, [
                ["Service", (s) => s.name],
                ["Provider", (s) => s.provider_name],
                ["Price", (s) => formatMoney(s.price_minor)],
                ["Duration", (s) => s.duration_minutes + " min"],
                ["Mode", (s) => s.mode],
                [
                  "Actions",
                  (s) => (
                    <div className="row">
                      <button
                        className="table-action"
                        onClick={() => open("services", s)}
                      >
                        Edit
                      </button>
                      <button
                        disabled={busy}
                        className="table-action"
                        onClick={() =>
                          action("care/services/" + s.id, { active: !s.active })
                        }
                      >
                        {s.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "slots" && (
            <section className="card">
              <div className="card-head">
                <h3>Appointment Availability · Dubai time</h3>
                <button className="button small" onClick={() => open("slots")}>
                  + Add Slot
                </button>
              </div>
              {rows(filtered, [
                ["Service", (s) => s.service_name],
                ["Provider", (s) => s.provider_name],
                ["Starts", (s) => localTime(s.starts_at)],
                ["Ends", (s) => localTime(s.ends_at)],
                [
                  "Actions",
                  (s) => (
                    <button
                      disabled={busy}
                      className="table-action"
                      onClick={() =>
                        action("care/slots/" + s.id, { active: !s.active })
                      }
                    >
                      {s.active ? "Close Slot" : "Open Slot"}
                    </button>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "dependents" && (
            <section className="card">
              <div className="card-head">
                <h3>Family Profiles</h3>
                <button
                  className="button small"
                  onClick={() => open("dependents")}
                >
                  + Add Dependent
                </button>
              </div>
              {rows(filtered, [
                ["Name", (d) => d.name],
                ["Relationship", (d) => d.relationship],
                ["Birth Date", (d) => d.birth_date?.slice(0, 10) || "—"],
                [
                  "Actions",
                  (d) => (
                    <button
                      className="table-action"
                      onClick={() => open("dependents", d)}
                    >
                      Edit Profile
                    </button>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "records" && (
            <section className="card">
              <div className="card-head">
                <h3>Authorized Care Records & Messages</h3>
                <div className="row">
                  <button
                    className="button small"
                    onClick={() => open("records")}
                  >
                    + Add Record
                  </button>
                  {["lab", "admin"].includes(user.role) && (
                    <button
                      className="button secondary small"
                      onClick={() => open("lab-reports")}
                    >
                      Release Lab Report
                    </button>
                  )}
                </div>
              </div>
              {filtered.length ? (
                filtered.map((r) => (
                  <article className="detail-item" key={r.id}>
                    <div className="row spread">
                      <div>
                        <span className="tag">{r.kind.replace("_", " ")}</span>
                        <h3 style={{ margin: "8px 0" }}>{r.title}</h3>
                        <small>
                          {r.patient_name} · {r.provider_name}
                        </small>
                      </div>
                      {badge(r.status)}
                    </div>
                    <p className="article-body" style={{ marginTop: 12 }}>
                      {r.body}
                    </p>
                    {r.file_id && (
                      <a
                        className="link"
                        href={"/v1/dashboard/files/" + r.file_id}
                      >
                        Download Attachment
                      </a>
                    )}
                    <div className="row" style={{ marginTop: 12 }}>
                      {r.status === "Draft" && r.author_id === user.id && (
                        <button
                          className="table-action"
                          disabled={busy}
                          onClick={() =>
                            action("care/records/" + r.id, {
                              status: "Released",
                            })
                          }
                        >
                          Release Record
                        </button>
                      )}
                      {r.kind === "lab_order" &&
                        ["lab", "technician", "admin"].includes(user.role) &&
                        (
                          {
                            Requested: "Accepted",
                            Accepted: "Collected",
                            Collected: "Processing",
                            Processing: "Completed",
                          } as any
                        )[r.status] && (
                          <button
                            disabled={busy}
                            className="table-action"
                            onClick={() =>
                              action("care/records/" + r.id, {
                                status: (
                                  {
                                    Requested: "Accepted",
                                    Accepted: "Collected",
                                    Collected: "Processing",
                                    Processing: "Completed",
                                  } as any
                                )[r.status],
                              })
                            }
                          >
                            Mark{" "}
                            {
                              (
                                {
                                  Requested: "Accepted",
                                  Accepted: "Collected",
                                  Collected: "Processing",
                                  Processing: "Completed",
                                } as any
                              )[r.status]
                            }
                          </button>
                        )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty">
                  Records shared with you will appear here.
                </div>
              )}
            </section>
          )}
          {tab === "invoices" && (
            <section className="card">
              <h3 style={{ marginBottom: 18 }}>Invoices & Received Payments</h3>
              {rows(filtered, [
                ["Reference", (i) => i.id.slice(0, 8).toUpperCase()],
                ["Patient", (i) => i.patient_name],
                ["Provider", (i) => i.provider_name],
                ["Amount", (i) => formatMoney(i.amount_minor)],
                ["Status", (i) => badge(i.status)],
                ["Method", (i) => i.payment_method || "—"],
                [
                  "Actions",
                  (i) => (
                    <>
                      {business && i.status === "Issued" && (
                        <button
                          className="table-action"
                          onClick={() => open("invoices", i)}
                        >
                          Record Received Payment
                        </button>
                      )}
                    </>
                  ),
                ],
              ])}
              <p className="muted" style={{ marginTop: 16 }}>
                Online card processing is not configured. Offline payments are
                recorded by the provider after receipt.
              </p>
            </section>
          )}
          {tab === "favorites" && (
            <section className="card">
              <h3>Saved Providers</h3>
              {rows(filtered, [
                [
                  "Provider",
                  (p) => (
                    <Link className="link" href={"/providers/" + p.slug}>
                      {p.name}
                    </Link>
                  ),
                ],
                ["Type", (p) => p.kind],
                ["Area", (p) => p.area],
                [
                  "Actions",
                  (p) => (
                    <button
                      className="table-action danger"
                      onClick={() =>
                        action(
                          "care/favorites",
                          { providerId: p.id, saved: false },
                          "POST",
                        )
                      }
                    >
                      Remove
                    </button>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "reviews" && (
            <section className="card">
              <div className="card-head">
                <h3>Patient Reviews</h3>
                {user.role === "patient" && (
                  <button
                    className="button small"
                    onClick={() => open("reviews")}
                  >
                    Write Review
                  </button>
                )}
              </div>
              {rows(filtered, [
                ["Provider", (r) => r.provider_name],
                ["Rating", (r) => "★".repeat(r.rating)],
                ["Comment", (r) => r.comment],
                ["Status", (r) => badge(r.status)],
                [
                  "Actions",
                  (r) =>
                    admin ? (
                      <div className="row">
                        <button
                          className="table-action"
                          onClick={() =>
                            action("care/reviews/" + r.id, {
                              status: "Published",
                            })
                          }
                        >
                          Publish
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() =>
                            action("care/reviews/" + r.id, { status: "Hidden" })
                          }
                        >
                          Hide
                        </button>
                      </div>
                    ) : null,
                ],
              ])}
            </section>
          )}
          {tab === "notifications" && (
            <section className="card">
              {filtered.length ? (
                filtered.map((n) => (
                  <button
                    className={"notification " + (!n.read_at ? "unread" : "")}
                    key={n.id}
                    onClick={() => action("care/notifications/" + n.id, {})}
                  >
                    <strong>{n.title}</strong>
                    <small style={{ display: "block", marginTop: 7 }}>
                      {localTime(n.created_at)} ·{" "}
                      {n.read_at ? "Read" : "Mark as read"}
                    </small>
                  </button>
                ))
              ) : (
                <div className="empty">No notifications yet.</div>
              )}
            </section>
          )}
          {tab === "claims" && (
            <section className="card">
              <div className="card-head">
                <h3>Ownership Claims</h3>
                <Link className="button small" href="/claim-listing">
                  Claim a Listing
                </Link>
              </div>
              {rows(filtered, [
                ["Provider", (c) => c.provider_name],
                ["Evidence", (c) => c.evidence],
                ["Status", (c) => badge(c.status)],
                [
                  "Actions",
                  (c) =>
                    admin && c.status === "Pending" ? (
                      <div className="row">
                        <button
                          className="table-action"
                          onClick={() =>
                            action("care/claims/" + c.id, {
                              status: "Approved",
                            })
                          }
                        >
                          Approve Ownership
                        </button>
                        <button
                          className="table-action danger"
                          onClick={() =>
                            action("care/claims/" + c.id, {
                              status: "Rejected",
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : null,
                ],
              ])}
            </section>
          )}
          {tab === "users" && (
            <section className="card">
              <h3>Account Roles & Access</h3>
              {rows(filtered, [
                ["Name", (u) => u.name],
                ["Email", (u) => u.email],
                ["Role", (u) => u.role],
                ["Status", (u) => badge(u.status)],
                [
                  "Actions",
                  (u) => (
                    <div className="row">
                      <button
                        className="table-action"
                        onClick={() => open("users", u)}
                      >
                        Edit Account
                      </button>
                      <button
                        className="table-action"
                        onClick={() => setAdminProfile(u)}
                      >
                        Edit Profile
                      </button>
                    </div>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "settings" && schema && (
            <section className="card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action("admin/settings", values);
                }}
              >
                <Fields
                  fields={schema.settingFields}
                  values={values}
                  onChange={(k, v) => setValues({ ...values, [k]: v })}
                />
                <button
                  disabled={busy}
                  className="button"
                  style={{ marginTop: 20 }}
                >
                  Save Settings
                </button>
              </form>
            </section>
          )}
          {tab==='cms:articles' && <BlogWorkspace user={user} startNew={newPost} onStarted={()=>setNewPost(false)}/>}
          {tab.startsWith("cms:") && tab!=='cms:articles' && (
            <section className="card">
              <div className="card-head">
                <h3>{schema.modules[tab.slice(4)].label}</h3>
                <button className="button small" onClick={() => open(tab)}>
                  + Add Record
                </button>
              </div>
              {rows(filtered, [
                [
                  "Record",
                  (r) =>
                    r.data.title ||
                    r.data.name ||
                    r.data.question ||
                    r.data.patientName ||
                    r.id.slice(0, 8),
                ],
                [
                  "Details",
                  (r) =>
                    Object.entries(r.data)
                      .filter(([k]) => !["body", "answer"].includes(k))
                      .slice(0, 4)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · "),
                ],
                ["Status", (r) => badge(r.data.status || "Saved")],
                [
                  "Actions",
                  (r) => (
                    <div className="row">
                      <button
                        className="table-action"
                        onClick={() => open(tab, r)}
                      >
                        Edit
                      </button>
                      <button
                        className="table-action danger"
                        onClick={async () => {
                          await action(
                            "dashboard/records/" +
                              tab.slice(4) +
                              "/" +
                              r.id +
                              "/archive",
                            {},
                            "POST",
                          );
                          const list = await api(
                            "dashboard/records/" + tab.slice(4),
                          );
                          setData((old) => ({ ...old, [tab]: list.items }));
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  ),
                ],
              ])}
            </section>
          )}
          {tab === "providers" && details && (
            <BusinessDetails
              provider={details}
              onClose={() => setDetails(null)}
            />
          )}
        </main>
      </div>
      {profile && schema && (
        <ProfileWizard
          user={user}
          schema={schema}
          onClose={() => setProfile(false)}
          onSaved={setUser}
        />
      )}{" "}
      {listing && schema && (
        <ListingWizard
          schema={schema}
          user={user}
          facilities={facilities}
          provider={listing}
          onClose={() => setListing(null)}
          onSaved={load}
        />
      )}{" "}
      {adminProfile && schema && (
        <ProfileWizard
          user={adminProfile}
          schema={schema}
          savePath={"admin/profiles/" + adminProfile.id}
          onClose={() => setAdminProfile(null)}
          onSaved={() => load()}
        />
      )}
      {editor && (
        <Modal
          title={
            editor.row
              ? "Update Record"
              : "Add " + editor.kind.replace("cms:", "").replace("-", " ")
          }
          onClose={() => setEditor(null)}
        >
          <form onSubmit={submit} style={{ marginTop: 22 }}>
            <Fields
              fields={editor.fields.filter((f: Field) => !editor.opts[f.key])}
              values={values}
              onChange={(k, v) => setValues({ ...values, [k]: v })}
            />
            {Object.entries(editor.opts).length > 0 && (
              <div className="form-grid" style={{ marginTop: 14 }}>
                {Object.entries(editor.opts).map(([k, options]: any) => (
                  <select
                    key={k}
                    className="field"
                    aria-label={
                      editor.fields.find((f: Field) => f.key === k)?.label
                    }
                    required={
                      editor.fields.find((f: Field) => f.key === k)?.required
                    }
                    value={values[k] || ""}
                    onChange={(e) =>
                      setValues({ ...values, [k]: e.target.value })
                    }
                  >
                    <option value="">
                      {editor.fields.find((f: Field) => f.key === k)?.label}
                    </option>
                    {options.map((o: any) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Save Record"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

