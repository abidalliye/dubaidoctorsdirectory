"use client";
import { useState } from "react";
import type { Provider } from "../lib/api";
export function DirectoryMap({ providers }: { providers: Provider[] }) {
  const located = providers.filter((p) => p.address),
    [selected, setSelected] = useState("");
  const provider = located.find((p) => p.id === selected) || located[0];
  return (
    <section className="card directory-map">
      <h3>Explore locations</h3>
      {provider ? (
        <>
          <select
            aria-label="Provider map location"
            className="field"
            value={provider.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {located.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <iframe
            title={`Map search for ${provider.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(provider.address + ", " + provider.area)}&output=embed`}
          />
          <p>{provider.address}</p>
          <a
            className="button small"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(provider.address + ", " + provider.area)}`}
          >
            Open Full Map ↗
          </a>
        </>
      ) : (
        <p className="muted">
          Providers have not supplied street addresses for these results.
        </p>
      )}
    </section>
  );
}
