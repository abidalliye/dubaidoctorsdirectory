"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/client-api";
import { Fields, Field } from "./forms";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const specs: Record<string, Field[]> = {
  hours: [
    {
      key: "weekday",
      label: "Weekday",
      type: "select",
      required: true,
      options: days,
    },
    { key: "opens", label: "Opening time", type: "time", required: true },
    { key: "closes", label: "Closing time", type: "time", required: true },
  ],
  licenses: [
    { key: "authority", label: "License authority", required: true },
    { key: "licenseNumber", label: "License number", required: true },
    { key: "expiresOn", label: "Expiry date", type: "date" },
    { key: "qualification", label: "Qualification", type: "textarea" },
    { key: "proofFileId", label: "License proof", type: "file" },
  ],
  branches: [
    { key: "name", label: "Branch name", required: true },
    { key: "country", label: "Country", required: true },
    { key: "city", label: "City", required: true },
    { key: "address", label: "Street address", required: true },
    { key: "phone", label: "Phone number", type: "tel" },
    { key: "latitude", label: "Latitude", type: "text" },
    { key: "longitude", label: "Longitude", type: "text" },
  ],
  team: [
    { key: "email", label: "Account email", type: "email", required: true },
    {
      key: "permission",
      label: "Team permission",
      type: "select",
      required: true,
      options: ["manager", "doctor", "technician", "billing"],
    },
  ],
};
export function BusinessDetails({
  provider,
  onClose,
}: {
  provider: any;
  onClose: () => void;
}) {
  const [tab, setTab] = useState("hours"),
    [data, setData] = useState<any>({
      hours: [],
      licenses: [],
      branches: [],
      media: [],
      team: [],
    }),
    [values, setValues] = useState<Record<string, any>>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [image, setImage] = useState<File | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    try {
      const [d, t] = await Promise.all([
        api("care/providers/" + provider.id + "/details"),
        api("care/providers/" + provider.id + "/team"),
      ]);
      setData({ ...d, team: t.items });
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    load();
  }, [provider.id]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...values };
      if (tab === "hours") body.weekday = String(days.indexOf(body.weekday));
      if (tab === "media") {
        if (!image) throw new Error("Choose an image");
        if (image.size > 1048576) throw new Error("Choose an image up to 1 MB");
        body.type = image.type;
        body.content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      }
      await api("care/providers/" + provider.id + "/" + tab, "POST", body);
      setValues({});
      setImage(null);
      setMessage("Business details saved");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: string, id: string) {
    setError("");
    try {
      await api(
        "care/providers/" +
          provider.id +
          (kind === "team"
            ? "/team/" + id + "/remove"
            : "/details/" + kind + "/" + id + "/remove"),
        "POST",
        {},
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="profile-sections">
      <div className="card">
        <div className="card-head">
          <div>
            <h2>{provider.name}</h2>
            <p className="muted">
              Complete your business profile and team details.
            </p>
          </div>
          <button className="button secondary small" onClick={onClose}>
            Back to Listings
          </button>
        </div>
        <div className="tabs">
          {[
            ["hours", "Opening Hours"],
            ["licenses", "Credentials"],
            ["branches", "Branches"],
            ["media", "Gallery"],
            ["team", "Team & Permissions"],
          ].map(([k, label]) => (
            <button
              className={tab === k ? "active" : ""}
              key={k}
              onClick={() => {
                setTab(k);
                setValues({});
                setMessage("");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="success" role="status">
            {message}
          </div>
        )}
        <form onSubmit={save}>
          {tab === "media" ? (
            <div className="form-grid">
              <input
                className="field"
                aria-label="Gallery image"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                required
              />
              <input
                className="field"
                aria-label="Image caption"
                placeholder="Image caption"
                value={values.caption || ""}
                onChange={(e) =>
                  setValues({ ...values, caption: e.target.value })
                }
                maxLength={200}
              />
              <small className="muted full">
                PNG or JPEG up to 1 MB. Gallery images become public when your
                listing is published.
              </small>
            </div>
          ) : (
            <Fields
              fields={specs[tab]}
              values={values}
              onChange={(k, v) => setValues({ ...values, [k]: v })}
            />
          )}
          <button className="button" disabled={busy} style={{ marginTop: 20 }}>
            {busy
              ? "Saving…"
              : tab === "team"
                ? "Grant Team Access"
                : tab === "media"
                  ? "Add Gallery Image"
                  : "Add " +
                    (tab === "hours"
                      ? "Opening Interval"
                      : tab === "licenses"
                        ? "Credential"
                        : "Branch")}
          </button>
          {tab === "team" && (
            <p className="muted" style={{ marginTop: 15 }}>
              Use an existing active business account. Managers can edit
              business details; doctors and technicians access authorized care;
              billing staff handle operational billing.
            </p>
          )}
        </form>
      </div>
      <div className="card">
        <h2 style={{ marginBottom: 20 }}>
          Saved{" "}
          {tab === "media"
            ? "Gallery"
            : tab === "team"
              ? "Team Members"
              : tab === "hours"
                ? "Opening Hours"
                : tab === "licenses"
                  ? "Credentials"
                  : "Branches"}
        </h2>
        {!data[tab]?.length ? (
          <div className="empty">No records added yet.</div>
        ) : tab === "media" ? (
          <div className="grid three">
            {data.media.map((m: any) => (
              <div className="card" key={m.id}>
                <img
                  src={"/v1/care/media/" + m.id}
                  alt={m.caption || "Business gallery"}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <p style={{ margin: "12px 0" }}>{m.caption}</p>
                <button
                  className="table-action danger"
                  onClick={() => remove("media", m.id)}
                >
                  Remove Image
                </button>
              </div>
            ))}
          </div>
        ) : (
          data[tab].map((r: any) => (
            <div className="detail-item row spread" key={r.id}>
              <div>
                {tab === "hours" ? (
                  <strong>
                    {days[r.weekday]} · {r.opens.slice(0, 5)}–
                    {r.closes.slice(0, 5)}
                  </strong>
                ) : tab === "licenses" ? (
                  <>
                    <strong>
                      {r.authority} · {r.license_number}
                    </strong>
                    <p className="muted">
                      {r.qualification}
                      {r.expires_on &&
                        " · Expires " + r.expires_on.slice(0, 10)}
                    </p>
                    {r.proof_file_id && (
                      <a
                        className="link"
                        href={"/v1/dashboard/files/" + r.proof_file_id}
                      >
                        Private Proof File
                      </a>
                    )}
                  </>
                ) : tab === "branches" ? (
                  <>
                    <strong>
                      {r.name} · {r.city}, {r.country}
                    </strong>
                    <p className="muted">
                      {r.address} · {r.phone}
                    </p>
                  </>
                ) : (
                  <>
                    <strong>{r.name}</strong>
                    <p className="muted">
                      {r.email} · {r.role} · {r.permission}
                    </p>
                  </>
                )}
              </div>
              {r.permission !== "owner" && (
                <button
                  className="table-action danger"
                  onClick={() => remove(tab, r.id)}
                >
                  {tab === "team" ? "Revoke Access" : "Remove"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
