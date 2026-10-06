"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatMoney, localTime, User } from "../lib/client-api";
import { Avatar } from "./provider-card";
export function Booking({ provider }: { provider: any }) {
  const [user, setUser] = useState<User | null>(null),
    [services, setServices] = useState<any[]>([]),
    [slots, setSlots] = useState<any[]>([]),
    [dependents, setDependents] = useState<any[]>([]),
    [service, setService] = useState(""),
    [slot, setSlot] = useState(""),
    [step, setStep] = useState(0),
    [values, setValues] = useState<Record<string, string>>({
      dependentId: "",
      reason: "",
      insurance: "",
      phone: "",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.allSettled([
      api("auth/me"),
      api("care/public/services?provider=" + encodeURIComponent(provider.id)),
      api("care/dependents"),
    ]).then((results) => {
      if (results[0].status === "fulfilled") {
        setUser(results[0].value.user);
        setValues((v) => ({
          ...v,
          phone:
            results[0].status === "fulfilled"
              ? results[0].value.user.phone
              : "",
        }));
      }
      if (results[1].status === "fulfilled") {
        setServices(results[1].value.items);
        const selected = new URLSearchParams(location.search).get("service");
        if (
          selected &&
          results[1].value.items.some((s: any) => s.id === selected)
        )
          setService(selected);
      } else setError(results[1].reason.message);
      if (results[2].status === "fulfilled")
        setDependents(results[2].value.items);
      setLoading(false);
    });
  }, [provider.id]);
  useEffect(() => {
    if (!service) return;
    let active=true;
    setSlot("");
    setSlots([]);
    api("care/public/slots/" + service)
      .then((r) => {if(!active)return;setSlots(r.items);const selected=new URLSearchParams(location.search).get('slot');if(selected&&r.items.some((s:any)=>s.id===selected))setSlot(selected)})
      .catch((e) => {if(active)setError(e.message)});
    return()=>{active=false};
  }, [service]);
  const chosen = services.find((s) => s.id === service),
    chosenSlot = slots.find((s) => s.id === slot);
  async function next(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (step === 0 && (!chosen || !chosenSlot)) {
      setError("Choose a service and available slot");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      const record = await api("care/appointments", "POST", {
        slotId: slot,
        ...values,
        dependentId: values.dependentId || undefined,
      });
      location.assign("/appointments/" + record.record.id + "/confirmation");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="page-intro">
        <div className="container">
          <p className="breadcrumb">
            <Link href={"/providers/" + provider.slug}>{provider.name}</Link> ›
            Book appointment
          </p>
          <h1>Book Your Appointment</h1>
          <p>Choose care, enter patient details and review your request.</p>
        </div>
      </section>
      <main className="container wizard-layout">
        <section className="card">
          <div className="stepper">
            {[
              "Appointment",
              "Patient Details",
              "Insurance & Payment",
              "Review & Book",
            ].map((title, i) => (
              <div
                className={`step-dot ${i <= step ? "active" : ""}`}
                key={title}
              >
                {i + 1}. {title}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="empty">Loading available services…</div>
          ) : !user ? (
            <div className="empty">
              <h3>Sign in to book your appointment</h3>
              <Link className="button" style={{ marginTop: 18 }} href={'/auth?next='+encodeURIComponent('/book/'+provider.slug+'?'+new URLSearchParams({service,slot}))}>
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={next}>
              {step === 0 && (
                <>
                  <h2 style={{ marginBottom: 20 }}>Choose your appointment</h2>
                  <select
                    className="field"
                    aria-label="Service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                  >
                    <option value="">Choose service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.mode} · {formatMoney(s.price_minor)}
                      </option>
                    ))}
                  </select>
                  {chosen && (
                    <>
                      <p className="muted" style={{ margin: "15px 0" }}>
                        {chosen.description}
                      </p>
                      <h3 style={{ margin: "20px 0 14px" }}>
                        Available Slots · Dubai time
                      </h3>
                      <div className="grid three">
                        {slots.map((s) => (
                          <button
                            className={
                              "button " + (slot === s.id ? "" : "secondary")
                            }
                            key={s.id}
                            type="button"
                            onClick={() => setSlot(s.id)}
                          >
                            {localTime(s.starts_at)}
                          </button>
                        ))}
                      </div>
                      {!slots.length && (
                        <div className="empty">
                          No online slots are currently available for this
                          service.
                        </div>
                      )}
                    </>
                  )}
                  {!services.length && (
                    <div className="empty">
                      This provider has not published online services yet.
                      Contact the provider directly.
                    </div>
                  )}
                </>
              )}
              {step === 1 && (
                <>
                  <h2 style={{ marginBottom: 20 }}>Patient Details</h2>
                  <div className="form-grid">
                    <select
                      className="field"
                      aria-label="Patient"
                      value={values.dependentId}
                      onChange={(e) =>
                        setValues({ ...values, dependentId: e.target.value })
                      }
                    >
                      <option value="">Myself · {user.name}</option>
                      {dependents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} · {d.relationship}
                        </option>
                      ))}
                    </select>
                    <input
                      className="field"
                      type="tel"
                      aria-label="Contact phone"
                      placeholder="Contact phone"
                      value={values.phone}
                      onChange={(e) =>
                        setValues({ ...values, phone: e.target.value })
                      }
                      maxLength={50}
                    />
                    <textarea
                      className="field full"
                      aria-label="Reason for visit"
                      placeholder="Visit reason"
                      value={values.reason}
                      onChange={(e) =>
                        setValues({ ...values, reason: e.target.value })
                      }
                      maxLength={3000}
                    />
                  </div>
                  <p className="muted" style={{ marginTop: 18 }}>
                    Your account details identify you for this booking.{" "}
                    <Link className="link" href="/dashboard">
                      Update your profile or add a dependent →
                    </Link>
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 style={{ marginBottom: 20 }}>Insurance & Payment</h2>
                  <div className="form-grid">
                    <input
                      className="field"
                      aria-label="Insurance provider"
                      placeholder="Insurance provider"
                      value={values.insurance}
                      onChange={(e) =>
                        setValues({ ...values, insurance: e.target.value })
                      }
                      maxLength={150}
                    />
                    <div className="field muted">Pay at provider</div>
                  </div>
                  <p className="muted" style={{ marginTop: 18 }}>
                    Leave insurance empty for self-pay. The provider must
                    confirm insurance coverage. No online payment is taken for
                    this request.
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 style={{ marginBottom: 18 }}>Review Your Appointment</h2>
                  <div className="detail-grid">
                    {[
                      ["Provider", provider.name],
                      ["Service", chosen?.name],
                      [
                        "Patient",
                        values.dependentId
                          ? dependents.find((d) => d.id === values.dependentId)
                              ?.name
                          : user.name,
                      ],
                      [
                        "Date & Time",
                        chosenSlot ? localTime(chosenSlot.starts_at) : "",
                      ],
                      ["Consultation", chosen?.mode],
                      ["Price", chosen ? formatMoney(chosen.price_minor) : ""],
                      ["Insurance", values.insurance || "Self-pay"],
                      ["Contact", values.phone || "Not supplied"],
                    ].map(([title, value]) => (
                      <div className="detail-item" key={title}>
                        <small>{title}</small>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <p className="muted" style={{ marginTop: 18 }}>
                    {values.reason}
                  </p>
                  <label className="check-row">
                    <input type="checkbox" required />I agree to send this
                    appointment request and its details to the selected
                    provider.
                  </label>
                </>
              )}
              {error && (
                <div role="alert" className="error">
                  {error}
                </div>
              )}
              <div className="modal-actions">
                {step > 0 ? (
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => setStep(step - 1)}
                  >
                    ← Back
                  </button>
                ) : (
                  <Link
                    className="button secondary"
                    href={"/providers/" + provider.slug}
                  >
                    Back to Profile
                  </Link>
                )}
                <button
                  className="button"
                  disabled={busy || (step === 0 && !slot)}
                >
                  {busy
                    ? "Submitting…"
                    : step === 3
                      ? "Request Appointment"
                      : "Continue →"}
                </button>
              </div>
            </form>
          )}
        </section>
        <aside className="card">
          <div className="row">
            <Avatar name={provider.name} url={provider.details?.photoUrl} />
            <div>
              <h3>{provider.name}</h3>
              <p className="muted">{provider.specialty}</p>
            </div>
          </div>
          <div className="detail-item">
            <small>Location</small>
            <p>{provider.address || provider.area}</p>
          </div>
          {chosen && (
            <div className="detail-item">
              <small>Selected Service</small>
              <strong>{chosen.name}</strong>
              <p>
                {chosen.duration_minutes} minutes · {chosen.mode}
              </p>
              <strong>{formatMoney(chosen.price_minor)}</strong>
            </div>
          )}
          {chosenSlot && (
            <div className="detail-item">
              <small>Appointment Time</small>
              <strong>{localTime(chosenSlot.starts_at)}</strong>
            </div>
          )}
          <p className="muted" style={{ marginTop: 18 }}>
            Your booking starts as a request. The provider will confirm it
            through their dashboard.
          </p>
        </aside>
      </main>
    </>
  );
}
export function Confirmation({ id }: { id: string }) {
  const [record, setRecord] = useState<any>(null),
    [history, setHistory] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api("care/appointments"), api("care/history/" + id)])
      .then(([r, h]) => {
        const a = r.items.find((a: any) => a.id === id);
        if (!a) throw new Error("Appointment not found");
        setRecord(a);
        setHistory(h.items);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  return (
    <main className="container section">
      <div className="card" style={{ maxWidth: 850, margin: "auto" }}>
        {error ? (
          <div className="error">
            {error}
            <br />
            <Link className="link" href="/auth">
              Sign In
            </Link>
          </div>
        ) : record ? (
          <>
            <span className="icon-tile green" style={{ margin: "0 auto 18px" }}>
              ✓
            </span>
            <h1 style={{ textAlign: "center" }}>Appointment {record.status}</h1>
            <p className="muted" style={{ textAlign: "center", marginTop: 10 }}>
              {record.status === "Requested"
                ? "Your request was saved. Await provider confirmation."
                : "Your appointment details are saved below."}
            </p>
            <div className="detail-grid" style={{ marginTop: 25 }}>
              {[
                ["Reference", record.id.slice(0, 8).toUpperCase()],
                ["Provider", record.provider_name],
                ["Patient", record.patient_name],
                ["Service", record.service_name],
                ["Date & Time", localTime(record.starts_at)],
                ["Location", record.area],
                ["Price", formatMoney(record.price_minor)],
                ["Consultation", record.mode],
              ].map(([k, v]) => (
                <div className="detail-item" key={k}>
                  <small>{k}</small>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <h3 style={{ marginTop: 25 }}>Appointment History</h3>
            {history.map((h, i) => (
              <p className="muted" key={i}>
                {h.status} · {localTime(h.created_at)}
              </p>
            ))}
            <div className="row" style={{ marginTop: 25 }}>
              <Link className="button" href="/dashboard">
                Manage in Dashboard
              </Link>
              <Link
                className="button secondary"
                href={"/providers/" + record.slug}
              >
                View Provider
              </Link>
            </div>
          </>
        ) : (
          <div className="empty">Loading appointment…</div>
        )}
      </div>
    </main>
  );
}
