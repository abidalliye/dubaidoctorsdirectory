"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatMoney, localTime, User } from "../lib/client-api";
import { Avatar } from "./provider-card";
import { Icon } from "./icon";
type Row = Record<string, any>;
type Props = {
  user: User;
  data: Record<string, Row[]>;
  overview: any;
  appointments: Row[];
  from: string;
  to: string;
  onTab: (tab: string) => void;
  onProfile: () => void;
  onAdd: (kind: string) => void;
  onListing: () => void;
};
const colors = ["#0877ff", "#00b893", "#00b9f1", "#8551eb", "#ff9200"];
function Panel({
  title,
  children,
  onView,
}: {
  title: string;
  children: React.ReactNode;
  onView?: () => void;
}) {
  return (
    <section className="card role-panel">
      <div className="card-head">
        <h3>{title}</h3>
        {onView && (
          <button className="link" onClick={onView}>
            View All
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
function Empty() {
  return <p className="role-empty">No records to display.</p>;
}
function Status({ value }: { value: string }) {
  return (
    <span
      className={`badge ${["Requested", "Draft", "Issued", "Pending"].includes(value) ? "pending" : ["Cancelled", "Rejected"].includes(value) ? "cancelled" : ""}`}
    >
      {value}
    </span>
  );
}
function Table({
  heads,
  rows,
}: {
  heads: string[];
  rows: React.ReactNode[][];
}) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {heads.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
function Revenue({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty />;
  const max = Math.max(1, ...rows.map((r) => r.amount)),
    first = Date.parse(rows[0].date),
    span = Math.max(86400000, Date.parse(rows.at(-1)!.date) - first),
    x = (r: Row) => 30 + ((Date.parse(r.date) - first) / span) * 390,
    points = rows
      .map((r) => `${x(r)},${145 - (r.amount / max) * 110}`)
      .join(" ");
  return (
    <svg
      className="role-revenue"
      viewBox="0 0 450 175"
      role="img"
      aria-label="Received revenue by payment date"
    >
      {[35, 90, 145].map((y, i) => (
        <g key={y}>
          <line x1="30" x2="420" y1={y} y2={y} stroke="#e5edf6" />
          <text x="0" y={y} fontSize="9">
            {Math.round((max / 100) * (1 - i / 2))}
          </text>
        </g>
      ))}
      <polygon
        points={`30,145 ${points} ${x(rows.at(-1)!)},145`}
        fill="#00b8931f"
      />
      <polyline points={points} stroke="#00b893" strokeWidth="2" fill="none" />
      {rows.map((r) => (
        <circle
          key={r.date}
          cx={x(r)}
          cy={145 - (r.amount / max) * 110}
          r="3"
          fill="#00b893"
        >
          <title>
            {r.date}: {formatMoney(r.amount)}
          </title>
        </circle>
      ))}
      <text x="30" y="169" fontSize="10">
        {rows[0].date}
      </text>
      <text x="420" y="169" textAnchor="end" fontSize="10">
        {rows.at(-1)!.date}
      </text>
    </svg>
  );
}
function BookingsChart({ overview }: { overview: any }) {
  const rows = overview?.trend || [],
    max = Math.max(1, ...rows.map((r: Row) => r.count));
  return rows.length ? (
    <div
      className="role-booking-chart"
      role="img"
      aria-label="Bookings per appointment date"
    >
      {rows.map((r: Row) => (
        <div key={r.date}>
          <span>{r.count}</span>
          <i
            style={{ height: `${(r.count / max) * 125}px` }}
            title={`${r.date}: ${r.count} bookings`}
          />
          <small>{r.date.slice(5)}</small>
        </div>
      ))}
    </div>
  ) : (
    <Empty />
  );
}
function Mix({ rows }: { rows: Row[] }) {
  const total = rows.reduce((n, r) => n + r.count, 0);
  let offset = 0;
  const gradient = rows
    .map((r, i) => {
      const start = offset;
      offset += (r.count / Math.max(total, 1)) * 100;
      return `${colors[i % colors.length]} ${start}% ${offset}%`;
    })
    .join(",");
  return total ? (
    <div className="role-mix">
      <div
        className="donut"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <strong>
          {total}
          <small>Bookings</small>
        </strong>
      </div>
      <div>
        {rows.map((r, i) => (
          <div className="legend" key={r.name}>
            <span>
              <i style={{ background: colors[i % colors.length] }} />
              {r.name}
            </span>
            <strong>{r.count}</strong>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <Empty />
  );
}
export function RoleOverview({
  user,
  data,
  overview,
  appointments,
  from,
  to,
  onTab,
  onProfile,
  onAdd,
  onListing,
}: Props) {
  const patient = user.role === "patient",
    lab = ["lab", "technician"].includes(user.role);
  const [metrics, setMetrics] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setMetrics(null);
    setError("");
    api("care/dashboard-metrics?" + new URLSearchParams({ from, to }))
      .then((r) => {
        if (active) setMetrics(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [from, to, data.appointments]);
  const records = data.records || [],
    prescriptions = records.filter((r) => r.kind === "prescription"),
    reports = records.filter((r) => r.kind === "report"),
    invoices = data.invoices || [],
    notifications = data.notifications || [];
  const upcoming = appointments
      .filter(
        (a) =>
          ["Requested", "Confirmed"].includes(a.status) &&
          Date.parse(a.starts_at) > Date.now(),
      )
      .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at)),
    next = upcoming[0];
  const paid = metrics?.revenue?.reduce((n: number, r: Row) => n + r.amount, 0),
    booked = overview?.bookings?.reduce((n: number, r: Row) => n + r.count, 0),
    recordCount = (kind: string) =>
      metrics?.records?.find((r: Row) => r.kind === kind)?.count || 0;
  const metricRows = patient
    ? [
        ["calendar", metrics?.people.upcoming, "Upcoming Appointments"],
        ["user", metrics?.people.providers, "Booked Providers"],
        [
          "file",
          metrics ? recordCount("prescription") : undefined,
          "Prescriptions",
        ],
        ["lab", metrics ? recordCount("report") : undefined, "Lab Reports"],
        ["card", metrics ? formatMoney(paid) : undefined, "Payments Made"],
      ]
    : [
        ["calendar", booked, "Total Bookings"],
        ["user", metrics?.people.patients, "Patients Booked"],
        [
          lab ? "lab" : "file",
          metrics ? recordCount("report") : undefined,
          "Released Reports",
        ],
        ["card", metrics ? formatMoney(paid) : undefined, "Recorded Revenue"],
        ["star", metrics?.reviews.rating ?? "—", "Published Rating"],
      ];
  const appointmentTable = (items: Row[]) => (
    <Table
      heads={
        patient
          ? ["Date", "Provider", "Service", "Status", "Details"]
          : ["Patient", "Service", "Date & Time", "Status", "Details"]
      }
      rows={items.slice(0, 5).map((a) => [
        patient ? localTime(a.starts_at) : a.patient_name,
        patient ? a.provider_name : a.service_name,
        patient ? a.service_name : localTime(a.starts_at),
        <Status value={a.status} />,
        <Link
          className="table-action"
          href={`/appointments/${a.id}/confirmation`}
        >
          View
        </Link>,
      ])}
    />
  );
  const recordTable = (items: Row[]) => (
    <Table
      heads={["Title", "Provider", "Date", "Status"]}
      rows={items
        .slice(0, 5)
        .map((r) => [
          r.title,
          r.provider_name || "Care record",
          localTime(r.created_at),
          <Status value={r.status} />,
        ])}
    />
  );
  const actions = patient
    ? [
        ["calendar", "Book Appointment", () => location.assign("/doctors")],
        ["search", "Find Doctors", () => location.assign("/doctors")],
        ["file", "Prescriptions", () => onTab("records")],
        ["lab", "Lab Reports", () => onTab("records")],
        ["card", "Invoices", () => onTab("invoices")],
        ["star", "Write Review", () => onAdd("reviews")],
        ["bell", "Notifications", () => onTab("notifications")],
        ["user", "Add Family", () => onAdd("dependents")],
      ]
    : [
        ["lab", lab ? "Add New Test" : "Add Service", () => onAdd("services")],
        ["calendar", "Add Availability", () => onAdd("slots")],
        [
          "file",
          lab ? "Manage Reports" : "Care Records",
          () => onTab("records"),
        ],
        ["user", "Bookings", () => onTab("appointments")],
        ["card", "Manage Payments", () => onTab("invoices")],
        ["hospital", "Add Listing", onListing],
        ["star", "Reviews", () => onTab("reviews")],
        ["bell", "Notifications", () => onTab("notifications")],
      ];
  const clinicalProviders = [
    ...new Map(
      appointments.map((a) => [
        a.provider_id,
        { id: a.provider_id, name: a.provider_name, slug: a.slug },
      ]),
    ).values(),
  ].slice(0, 3);
  return (
    <div
      className={`role-overview ${patient ? "patient-overview" : lab ? "lab-overview" : "practice-overview"}`}
    >
      {error && (
        <p className="error" role="alert">
          Dashboard metrics unavailable: {error}
        </p>
      )}
      <div className="role-metrics">
        {metricRows.map(([icon, value, label], i) => (
          <div className="card role-metric" key={String(label)}>
            <span
              className="role-metric-icon"
              style={{ background: colors[i] }}
            >
              <Icon name={String(icon)} size={30} />
            </span>
            <strong>{value ?? "—"}</strong>
            <p>{label}</p>
            <small>
              {i === 4 && !patient
                ? `${metrics?.reviews.count ?? 0} published reviews`
                : i === 4 || (i === 3 && !patient)
                  ? "Selected payment dates"
                  : "Selected appointment dates"}
            </small>
          </div>
        ))}
      </div>
      {!patient && (
        <div className="role-charts">
          <Panel title="Bookings Overview">
            <BookingsChart overview={overview} />
          </Panel>
          <Panel title="Revenue Overview (AED)">
            <Revenue rows={metrics?.revenue || []} />
          </Panel>
          <Panel title={lab ? "Top Tests by Bookings" : "Services by Bookings"}>
            <Mix rows={metrics?.services || []} />
          </Panel>
        </div>
      )}
      <div className="role-content">
        <div className="role-main-panels">
          {patient && (
            <>
              <Panel
                title="Upcoming Appointment"
                onView={() => onTab("appointments")}
              >
                {next ? (
                  <div className="next-appointment">
                    <Avatar name={next.provider_name} />
                    <div>
                      <h3>{next.provider_name}</h3>
                      <p>{next.service_name}</p>
                      <small>{next.area}</small>
                    </div>
                    <div>
                      <p>{localTime(next.starts_at)}</p>
                      <Status value={next.status} />
                    </div>
                    <div className="row">
                      <Link
                        className="button secondary small"
                        href={`/appointments/${next.id}/confirmation`}
                      >
                        Manage Appointment
                      </Link>
                      <Link
                        className="button small"
                        href={`/appointments/${next.id}/confirmation`}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <Empty />
                    <Link className="button small" href="/doctors">
                      Book an Appointment
                    </Link>
                  </>
                )}
              </Panel>
              <Panel
                title="My Care Providers"
                onView={() => onTab("appointments")}
              >
                {clinicalProviders.length ? (
                  clinicalProviders.map((p) => (
                    <div className="care-provider-row" key={p.id}>
                      <Avatar name={p.name} />
                      <div>
                        <strong>{p.name}</strong>
                        <small>Previously booked</small>
                      </div>
                      <Link
                        className="button secondary small"
                        href={"/providers/" + p.slug}
                      >
                        View Profile
                      </Link>
                    </div>
                  ))
                ) : (
                  <Empty />
                )}
              </Panel>
            </>
          )}
          <Panel
            title={patient ? "Appointment History" : "Recent Bookings"}
            onView={() => onTab("appointments")}
          >
            {appointmentTable(
              patient
                ? appointments.filter(
                    (a) => Date.parse(a.starts_at) <= Date.now(),
                  )
                : appointments,
            )}
          </Panel>
          <Panel
            title={
              patient
                ? "Recent Prescriptions"
                : lab
                  ? "Recent Test Results"
                  : "Recent Care Records"
            }
            onView={() => onTab("records")}
          >
            {recordTable(
              patient
                ? prescriptions
                : lab
                  ? reports
                  : records.filter((r) => r.kind !== "message"),
            )}
          </Panel>
          <Panel
            title={
              patient
                ? "Medical Records"
                : lab
                  ? "My Tests & Services"
                  : "My Services"
            }
            onView={() => onTab(patient ? "records" : "services")}
          >
            {patient ? (
              recordTable(reports)
            ) : (
              <Table
                heads={["Service", "Price", "Mode", "Status"]}
                rows={(data.services || [])
                  .slice(0, 5)
                  .map((s) => [
                    s.name,
                    formatMoney(s.price_minor),
                    s.mode,
                    <Status value={s.active ? "Active" : "Inactive"} />,
                  ])}
              />
            )}
          </Panel>
          <Panel title="Payments & Invoices" onView={() => onTab("invoices")}>
            <Table
              heads={["Date", "Reference", "Amount", "Status"]}
              rows={invoices
                .slice(0, 5)
                .map((i) => [
                  localTime(i.created_at),
                  i.id.slice(0, 8),
                  formatMoney(i.amount_minor),
                  <Status value={i.status} />,
                ])}
            />
          </Panel>
        </div>
        <aside className="role-aside">
          {patient && (
            <Panel title="My Profile">
              <div className="patient-profile-card">
                <Avatar name={user.name} />
                <div>
                  <strong>{user.name}</strong>
                  <p>
                    {user.profile.profileComplete === "yes"
                      ? "Profile complete"
                      : "Profile in progress"}
                  </p>
                  <small>
                    Saved step {Number(user.profile.profileStep || 0) + 1}
                  </small>
                </div>
              </div>
              <button className="button secondary small" onClick={onProfile}>
                Update Profile
              </button>
            </Panel>
          )}
          <Panel title="Quick Actions">
            <div className="role-quick-actions">
              {actions.map(([icon, label, fn]) => (
                <button key={String(label)} onClick={fn as () => void}>
                  <Icon name={String(icon)} />
                  <span>{String(label)}</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel
            title={patient ? "Notifications" : "Tasks & Notifications"}
            onView={() => onTab("notifications")}
          >
            {notifications.length ? (
              notifications.slice(0, 4).map((n) => (
                <button
                  className="role-notification"
                  key={n.id}
                  onClick={() => onTab("notifications")}
                >
                  <Icon name="bell" />
                  <span>
                    <strong>{n.title}</strong>
                    <small>{localTime(n.created_at)}</small>
                  </span>
                  {!n.read_at && <i />}
                </button>
              ))
            ) : (
              <Empty />
            )}
          </Panel>
          <Panel title="Recent Reviews" onView={() => onTab("reviews")}>
            {(data.reviews || []).length ? (
              (data.reviews || []).slice(0, 3).map((r) => (
                <div className="role-review" key={r.id}>
                  <span>{"★".repeat(r.rating)}</span>
                  <strong>{r.provider_name || "Provider review"}</strong>
                  <p>{r.comment}</p>
                  <small>{r.status}</small>
                </div>
              ))
            ) : (
              <Empty />
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
