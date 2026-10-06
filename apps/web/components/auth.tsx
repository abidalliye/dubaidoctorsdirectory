"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/client-api";
import {useBrand} from './brand-context';
export function Auth() {
  const brand=useBrand();
  const [mode, setMode] = useState("login"),
    [role, setRole] = useState("patient"),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState("");
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("mode") === "register" || location.hash === '#register') setMode("register");
    if (
      p.get("role") &&
      [
        "patient",
        "doctor",
        "clinic",
        "hospital",
        "lab",
        "surgeon",
        "technician",
      ].includes(p.get("role")!)
    )
      setRole(p.get("role")!);
    if (p.get("reset")) {
      setToken(p.get("reset")!);
      setMode("reset");
    }
    if (p.get("verify")) {
      api("auth/verify", "POST", { token: p.get("verify") })
        .then(() => setSuccess("Email verified"))
        .catch((e) => setError(e.message));
    }
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(
        "auth/" +
          (mode === "register"
            ? "register"
            : mode === "forgot"
              ? "forgot"
              : mode === "reset"
                ? "reset"
                : "login"),
        "POST",
        mode === "register"
          ? { ...data, role }
          : mode === "reset"
            ? { password: data.password, token }
            : data,
      );
      if (mode === "login" || mode === "register") {
        const next = new URLSearchParams(location.search).get('next');
        let destination='/dashboard';
        if(next?.startsWith('/')){try{const url=new URL(next,location.origin);if(url.origin===location.origin)destination=url.pathname+url.search+url.hash}catch{}}
        location.assign(destination);
      } else
        setSuccess(
          mode === "reset"
            ? "Password updated. You can sign in."
            : "If the email is registered, recovery instructions will be sent.",
        );
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
          <h1>Your healthcare starts here</h1>
          <p>Join {brand} to manage appointments, profiles and care records.</p>
        </div>
      </section>
      <main className="container auth-layout">
        <section>
          <h2>One account. Connected care.</h2>
          <div className="grid two" style={{ marginTop: 22 }}>
            {[
              [
                "♙",
                "Patients",
                "Book appointments and access your shared care records.",
              ],
              [
                "✚",
                "Doctors",
                "Create an independent profile and manage patients.",
              ],
              [
                "▥",
                "Clinics & Hospitals",
                "Manage your facility, services and team.",
              ],
              [
                "⚗",
                "Labs & Technicians",
                "Manage test bookings, orders and reports.",
              ],
            ].map(([icon, title, text]) => (
              <div className="card" key={title}>
                <span className="icon-tile">{icon}</span>
                <h3 style={{ margin: "14px 0 9px" }}>{title}</h3>
                <p className="muted">{text}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create Account
            </button>
          </div>
          <h2>
            {mode === "register"
              ? "Create your account"
              : mode === "forgot"
                ? "Recover your account"
                : mode === "reset"
                  ? "Choose a new password"
                  : "Welcome back"}
          </h2>
          {mode === "register" && (
            <div className="role-grid">
              {[
                "patient",
                "doctor",
                "clinic",
                "hospital",
                "lab",
                "surgeon",
                "technician",
              ].map((r) => (
                <button
                  key={r}
                  className={`role-option ${r === role ? "active" : ""}`}
                  onClick={() => setRole(r)}
                >
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          )}
          <form style={{ marginTop: 22 }} onSubmit={submit}>
            <div className="form-grid">
              {mode === "register" && (
                <>
                  <input
                    className="field"
                    name="name"
                    aria-label="Full name"
                    placeholder="Full name"
                    required
                    maxLength={120}
                  />
                  <input
                    className="field"
                    name="phone"
                    aria-label="Phone number"
                    placeholder="Phone number"
                    type="tel"
                    maxLength={40}
                  />
                </>
              )}
              {mode !== "reset" && (
                <input
                  className={`field ${mode === "register" ? "" : "full"}`}
                  type="email"
                  name="email"
                  aria-label="Email address"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              )}{" "}
              {mode !== "forgot" && (
                <input
                  className={`field ${mode === "register" ? "" : "full"}`}
                  type="password"
                  name="password"
                  aria-label="Password"
                  placeholder="Password"
                  required
                  minLength={mode === "login" ? 1 : 12}
                  maxLength={128}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              )}
            </div>
            {mode === "register" && (
              <>
                <small className="field-hint">
                  Use 12–128 characters for your password.
                </small>
                <label className="check-row">
                  <input type="checkbox" required />I agree to the{" "}
                  <Link className="link" href="/pages/terms">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link className="link" href="/pages/privacy">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </>
            )}
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            {success && (
              <div role="status" className="success">
                {success}
              </div>
            )}
            <button
              className="button"
              style={{ width: "100%", marginTop: 20 }}
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : mode === "register"
                  ? "Create Account →"
                  : mode === "forgot"
                    ? "Send Recovery Email"
                    : mode === "reset"
                      ? "Update Password"
                      : "Sign In →"}
            </button>
            {mode === "login" && (
              <button
                type="button"
                className="link"
                style={{ border: 0, background: "none", marginTop: 16 }}
                onClick={() => setMode("forgot")}
              >
                Forgot password?
              </button>
            )}
          </form>
        </section>
      </main>
    </>
  );
}
