"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/client-api";
export function ProviderActions({
  id,
  slug,
  name,
}: {
  id: string;
  slug: string;
  name: string;
}) {
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(true),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setBusy(true);
    api("care/favorites")
      .then((r) => {
        if (active) setSaved(r.items.some((p: { id: string }) => p.id === id));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <div style={{ marginTop: 20 }}>
      <Link className="button" href={`/book/${slug}`}>
        Book Appointment
      </Link>
      <div className="row" style={{ marginTop: 10 }}>
        <button
          className="table-action"
          disabled={busy}
          aria-pressed={saved}
          onClick={async () => {
            setBusy(true);
            try {
              await api("care/favorites", "POST", {
                providerId: id,
                saved: !saved,
              });
              setSaved(!saved);
              setMessage(!saved ? "Provider saved" : "Provider removed");
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {saved ? "♥ Saved" : "♡ Save Provider"}
        </button>
        <button
          className="table-action"
          onClick={() => {
            let selected: { id: string; slug: string; name: string }[] = [];
            try {
              const stored = JSON.parse(
                localStorage.getItem("careatlas-compare") || "[]",
              );
              if (Array.isArray(stored))
                selected = stored.filter(
                  (p) =>
                    p &&
                    typeof p.id === "string" &&
                    typeof p.slug === "string" &&
                    p.id !== id,
                );
            } catch {}
            if (selected.length >= 4) {
              setMessage("Compare up to four providers");
              return;
            }
            localStorage.setItem(
              "careatlas-compare",
              JSON.stringify([...selected, { id, slug, name }]),
            );
            setMessage("Added to comparison");
          }}
        >
          Compare
        </button>
        <Link className="link" href="/doctors/compare">
          View comparison
        </Link>
      </div>
      {message && (
        <p role="status" className="muted" style={{ marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  );
}
