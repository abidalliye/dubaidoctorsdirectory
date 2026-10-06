"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatMoney, localTime } from "../lib/client-api";
export function ProfileBooking({
  slug,
  services,
}: {
  slug: string;
  services: any[];
}) {
  const [service, setService] = useState(services[0]?.id || ""),
    [slots, setSlots] = useState<any[]>([]),
    [slot, setSlot] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setSlot("");
    setSlots([]);
    setError("");
    if (!service) return;
    setLoading(true);
    api("care/public/slots/" + service)
      .then((r) => {
        if (active) setSlots(r.items);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);
  return (
    <section className="card profile-booking">
      <h2>Book an Appointment</h2>
      {services.length ? (
        <>
          <select
            aria-label="Choose service"
            className="field"
            value={service}
            onChange={(e) => setService(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {formatMoney(s.price_minor)} · {s.mode}
              </option>
            ))}
          </select>
          <select
            aria-label="Available date and time"
            className="field"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading slots" : "Choose a time"}
            </option>
            {slots.map((t) => (
              <option key={t.id} value={t.id}>
                {localTime(t.starts_at)}
              </option>
            ))}
          </select>
          {slot ? (
            <Link
              className="button"
              href={`/book/${slug}?${new URLSearchParams({ service, slot })}`}
            >
              Continue Booking →
            </Link>
          ) : (
            <p className="muted">
              {loading
                ? "Checking availability…"
                : slots.length
                  ? "Select an available time to continue."
                  : "No open slots for this service."}
            </p>
          )}
          <small>Appointments are requests until the provider confirms.</small>
        </>
      ) : (
        <p>
          Online booking opens when this provider publishes services and
          availability.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
