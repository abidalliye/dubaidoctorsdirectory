"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/client-api";
import { Avatar } from "./provider-card";
export function Compare() {
  const [items, setItems] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    let selected: {slug:string}[]=[];
    try {const stored=JSON.parse(localStorage.getItem("careatlas-compare")||"[]");if(Array.isArray(stored))selected=stored.filter(p=>p&&typeof p.slug==='string').slice(0,4)}catch{}
    Promise.all(
      selected.map((p: any) => api("providers/" + encodeURIComponent(p.slug))),
    )
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="container section">
      <h1>Compare Doctors</h1>
      <p className="muted" style={{ margin: "12px 0 25px" }}>
        Compare up to four providers using details from their profiles.
      </p>
      {error && <div className="error">{error}</div>}
      {!items.length ? (
        <div className="empty">
          Add providers using Compare on a profile.
          <br />
          <Link className="button" style={{ marginTop: 18 }} href="/doctors">
            Find Doctors
          </Link>
        </div>
      ) : (
        <div className="comparison">
          {items.map((p) => (
            <section className="card" key={p.id}>
              <Avatar name={p.name} url={p.details?.photoUrl} large />
              <h2 style={{ marginTop: 16 }}>{p.name}</h2>
              {[
                ["Specialty", p.specialty],
                ["Location", p.area],
                ["Experience", p.details?.experienceYears],
                ["Languages", p.details?.languages],
                ["Insurance", p.details?.insurance],
                ["Services", p.services.join(", ")],
                [
                  "Verification",
                  p.verified
                    ? "Verified listing"
                    : "Not independently verified",
                ],
              ].map(([k, v]) => (
                <div className="detail-item" key={k}>
                  <small>{k}</small>
                  <p>{v || "Not supplied"}</p>
                </div>
              ))}
              <Link
                className="button"
                style={{ marginTop: 18 }}
                href={"/providers/" + p.slug}
              >
                View Profile & Book
              </Link>
              <button
                className="table-action danger"
                style={{ margin: 12 }}
                onClick={() => {
                  const remaining = items.filter((i) => i.id !== p.id);
                  setItems(remaining);
                  localStorage.setItem(
                    "careatlas-compare",
                    JSON.stringify(
                      remaining.map((i) => ({
                        id: i.id,
                        slug: i.slug,
                        name: i.name,
                      })),
                    ),
                  );
                }}
              >
                Remove
              </button>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
