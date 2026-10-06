"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, User } from "../lib/client-api";
import { ListingWizard } from "./listing-wizard";
export function BusinessForm({providerId}:{providerId?:string}) {
  const [user, setUser] = useState<User | null>(null),
    [schema, setSchema] = useState<any>(null),
    [facilities, setFacilities] = useState<any[]>([]),
    [provider,setProvider]=useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api("auth/me"),
      api("dashboard/schema"),
      api("dashboard/facilities"),
    ])
      .then(async ([u, s, f]) => {
        if(providerId){const listings=await api(u.user.role==='admin'?'admin/providers':'account/providers');const selected=listings.items.find((p:any)=>p.id===providerId);if(!selected)throw new Error('Listing not found or you do not have editing access');setProvider(selected)}
        setUser(u.user);
        setSchema(s);
        setFacilities(f.items);
      })
      .catch((e) => setError(e.message));
  }, [providerId]);
  return (
    <>
      <section className="page-intro">
        <div className="container">
          <h1>List Your Business</h1>
          <p>
            Build a complete profile. Independent and affiliated practices are
            welcome.
          </p>
        </div>
      </section>
      <main className="container wizard-layout">
        <section>
          {error ? (
            <div className="card">
              <p className="error">{error}</p>
              <Link className="button" href="/auth?mode=register&role=doctor">
                Create Business Account
              </Link>
            </div>
          ) : user?.role === "patient" ? (
            <div className="card">
              <h2>A business account is required</h2>
              <p className="muted">
                Use your business account to create a professional listing.
              </p>
              <Link className="button" href="/dashboard">
                Your Dashboard
              </Link>
            </div>
          ) : user && schema ? (
            <ListingWizard
              inline
              provider={provider||undefined}
              user={user}
              schema={schema}
              facilities={facilities}
              onSaved={() => {}}
              onClose={() => location.assign("/dashboard")}
            />
          ) : (
            <div className="empty">Loading your account…</div>
          )}
        </section>
        <aside className="card">
          <h2>Profile Checklist</h2>
          {[
            "Business identity",
            "Contact & location",
            "Services & credentials",
            "Optional affiliation",
            "Administrator review",
          ].map((s, i) => (
            <div className="detail-item" key={s}>
              <span className="tag">{i + 1}</span> {s}
            </div>
          ))}
          <p className="muted" style={{ marginTop: 20 }}>
            Save each step. Your listing remains a draft until an administrator
            publishes it.
          </p>
        </aside>
      </main>
    </>
  );
}
export function ClaimForm() {
  const [providers, setProviders] = useState<any[]>([]),
    [id, setId] = useState(""),
    [evidence, setEvidence] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    setId(new URLSearchParams(location.search).get("provider") || "");
    api("providers?limit=50")
      .then((r) => setProviders(r.items))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="container wizard-layout">
      <section className="card">
        <h1>Claim & Verify Your Listing</h1>
        <p className="muted" style={{ margin: "12px 0 22px" }}>
          Provide evidence of ownership for administrator review.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("care/claims", "POST", { providerId: id, evidence });
              setMessage(
                "Claim saved. An administrator will review ownership evidence.",
              );
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <select
              className="field full"
              aria-label="Business listing"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            >
              <option value="">Choose listing</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <textarea
              className="field full"
              aria-label="Ownership evidence"
              placeholder="Ownership evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              required
              maxLength={5000}
            />
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
          <button disabled={busy} className="button" style={{ marginTop: 20 }}>
            {busy ? "Submitting…" : "Submit Ownership Claim"}
          </button>
        </form>
      </section>
      <aside className="card">
        <h2>How verification works</h2>
        <div className="detail-item">1. Choose the existing listing.</div>
        <div className="detail-item">
          2. Provide your business relationship and verification evidence.
        </div>
        <div className="detail-item">
          3. An administrator checks ownership before granting access.
        </div>
        <Link className="link" href="/dashboard">
          Track Your Claim →
        </Link>
      </aside>
    </main>
  );
}
