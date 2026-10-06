import Link from "next/link";
import { Provider, list, publicData } from "../lib/api";
import { Avatar, ProviderCard } from "./provider-card";
import { ProviderActions } from "./provider-actions";
import { ProfileBooking } from "./profile-booking";
import { ProfileShare } from "./profile-share";
import { DirectoryMap } from "./directory-map";
import { Icon } from "./icon";
const money = (n: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" }).format(
    n / 100,
  );
export async function ProviderProfile({ provider: p }: { provider: Provider }) {
  const d = p.details || {},
    facility = ["hospital", "clinic", "lab"].includes(p.kind),
    lab = p.kind === "lab";
  const results = await Promise.allSettled([
    publicData("care/public/services?provider=" + encodeURIComponent(p.id)),
    publicData("care/public/reviews/" + encodeURIComponent(p.id)),
    publicData("care/public/business/" + encodeURIComponent(p.id)),
    publicData(
      "care/public/provider-summaries?ids=" + encodeURIComponent(p.id),
    ),
    list({ kind: p.kind, area: p.area, limit: "4" }),
  ]);
  const get = (i: number) =>
    results[i].status === "fulfilled"
      ? (results[i] as PromiseFulfilledResult<any>).value
      : null;
  const services = get(0)?.items || [],
    reviews = get(1)?.items || [],
    business = get(2) || {
      hours: [],
      licenses: [],
      branches: [],
      media: [],
      professionals: [],
    },
    summary = get(3)?.items?.[0],
    related = (get(4)?.items || []).filter((r: Provider) => r.id !== p.id);
  const nav = [
    ["about", "Overview"],
    ["services", lab ? "Tests & Prices" : "Services & Prices"],
    ...(facility
      ? [["professionals", "Our Professionals"]]
      : [["credentials", "Education & Experience"]]),
    ["reviews", "Reviews"],
    ["locations", "Location"],
    ["gallery", "Gallery"],
  ];
  return (
    <div
      className={`provider-reference ${facility ? "facility-profile" : "doctor-profile"}`}
    >
      <div className="container">
        <p className="breadcrumb">
          <Link href="/">Home</Link> ›{" "}
          <Link href={"/directory?kind=" + p.kind}>{p.kind}</Link> › {p.name}
        </p>
        <main className="reference-profile-grid">
          <div className="reference-profile-main">
            <section className="card profile-identity">
              {facility && business.media.length > 0 && (
                <div className="facility-gallery">
                  {business.media.slice(0, 3).map((m: any) => (
                    <a
                      href={"/v1/care/public/media/" + m.id}
                      target="_blank"
                      rel="noreferrer"
                      key={m.id}
                    >
                      <img
                        src={"/v1/care/public/media/" + m.id}
                        alt={m.caption || p.name}
                      />
                    </a>
                  ))}
                </div>
              )}
              <div className="profile-identity-row">
                <div className="profile-portrait">
                  <Avatar name={p.name} url={d.photoUrl} large />
                  {summary?.next_slot && (
                    <span className="slot-chip">Appointments available</span>
                  )}
                </div>
                <div className="profile-identity-copy">
                  <div className="row spread">
                    <h1>
                      {p.name}{" "}
                      {p.verified && (
                        <span
                          className="verified-mark"
                          title="Verified listing"
                        >
                          ✓
                        </span>
                      )}
                    </h1>
                    <ProfileShare />
                  </div>
                  <p>{p.specialty || p.kind}</p>
                  {d.qualifications && (
                    <p className="muted">{d.qualifications}</p>
                  )}
                  <div className="profile-facts">
                    {summary?.review_count > 0 && (
                      <span className="review-score">
                        <span>★</span> <strong>{summary.rating}</strong> (
                        {summary.review_count} reviews)
                      </span>
                    )}
                    {d.experienceYears && (
                      <span>{d.experienceYears} years of experience</span>
                    )}
                    <span>⌖ {p.area || "Location not supplied"}</span>
                    {d.languages && <span>Speaks: {d.languages}</span>}
                    {d.dhaLicense && <span>License: {d.dhaLicense}</span>}
                  </div>
                  <div className="profile-feature-strip">
                    {(summary?.modes || []).map((mode: string) => (
                      <span key={mode}>
                        <Icon name="calendar" />
                        {mode}
                      </span>
                    ))}
                    {d.insurance && (
                      <span>
                        <Icon name="card" />
                        Insurance information
                      </span>
                    )}
                    {p.verified && (
                      <span>
                        <Icon name="check" />
                        Verified listing
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
            <nav className="profile-anchor-nav" aria-label="Profile sections">
              {nav.map(([id, label]) => (
                <a key={id} href={"#" + id}>
                  {label}
                </a>
              ))}
            </nav>
            {results.slice(0, 4).some((r) => r.status === "rejected") && (
              <p className="error" role="alert">
                Some profile information could not be loaded. Refresh to try
                again.
              </p>
            )}
            <section className="card" id="about">
              <h2>About {p.name}</h2>
              <div className="profile-about">
                <p>
                  {d.bio || "This provider has not supplied a description yet."}
                </p>
                <div className="profile-mini-stats">
                  {d.experienceYears && (
                    <div>
                      <Icon name="user" />
                      <strong>{d.experienceYears} years</strong>
                      <small>Experience</small>
                    </div>
                  )}
                  {summary?.review_count > 0 && (
                    <div>
                      <Icon name="star" />
                      <strong>{summary.rating} / 5</strong>
                      <small>Published reviews</small>
                    </div>
                  )}
                  {services.length > 0 && (
                    <div>
                      <Icon name={lab ? "lab" : "calendar"} />
                      <strong>{services.length}</strong>
                      <small>
                        {lab ? "Published tests" : "Bookable services"}
                      </small>
                    </div>
                  )}
                  {business.branches.length > 0 && (
                    <div>
                      <Icon name="hospital" />
                      <strong>{business.branches.length}</strong>
                      <small>Branches</small>
                    </div>
                  )}
                </div>
              </div>
            </section>
            <section className="card">
              <h2>
                {facility ? "Departments & Specialties" : "Specializations"}
              </h2>
              <div className="profile-service-rail">
                {[...new Set([p.specialty, ...p.services].filter(Boolean))].map(
                  (s: string) => (
                    <Link
                      href={
                        "/directory?" +
                        new URLSearchParams({ q: s, kind: p.kind })
                      }
                      key={s}
                    >
                      <span className="icon-tile">
                        <Icon name={lab ? "lab" : "heart"} />
                      </span>
                      {s}
                    </Link>
                  ),
                )}
              </div>
            </section>
            <section className="card" id="services">
              <div className="section-head">
                <h2>
                  {lab
                    ? "Lab Tests & Packages"
                    : "Services & Consultation Fees"}
                </h2>
                <Link className="link" href={"/book/" + p.slug}>
                  View Availability →
                </Link>
              </div>
              <div className="profile-service-grid">
                {services.map((s: any) => (
                  <Link key={s.id} href={`/book/${p.slug}?service=${s.id}`}>
                    <span className="icon-tile">
                      <Icon name={lab ? "lab" : "calendar"} />
                    </span>
                    <h3>{s.name}</h3>
                    <strong>{money(s.price_minor)}</strong>
                    <small>
                      {s.duration_minutes} min · {s.mode}
                    </small>
                    {s.description && <p>{s.description}</p>}
                  </Link>
                ))}
              </div>
              {!services.length && (
                <p>No bookable services have been published.</p>
              )}
            </section>
            {facility ? (
              <section className="card" id="professionals">
                <h2>Meet Our Healthcare Professionals</h2>
                <div className="grid three">
                  {business.professionals?.map((r: Provider) => (
                    <ProviderCard key={r.id} provider={r} />
                  ))}
                </div>
                {!business.professionals?.length && (
                  <p>No professional affiliations have been published.</p>
                )}
              </section>
            ) : (
              <section className="card" id="credentials">
                <h2>Education & Experience</h2>
                <div className="profile-credentials">
                  <div>
                    <h3>
                      <Icon name="file" />
                      Qualifications
                    </h3>
                    {d.qualifications && <p>{d.qualifications}</p>}
                    {business.licenses.map((l: any) => (
                      <div className="credential-entry" key={l.id}>
                        <strong>{l.qualification || l.authority}</strong>
                        <p>
                          {l.authority} · {l.license_number}
                        </p>
                        {l.expires_on && (
                          <small>
                            Expires {String(l.expires_on).slice(0, 10)}
                          </small>
                        )}
                      </div>
                    ))}
                    {!d.qualifications && !business.licenses.length && (
                      <p>Qualifications have not been supplied.</p>
                    )}
                  </div>
                  <div>
                    <h3>
                      <Icon name="user" />
                      Professional Experience
                    </h3>
                    <p>
                      {d.experienceYears
                        ? d.experienceYears +
                          " years of experience reported by this provider."
                        : "Experience information has not been supplied."}
                    </p>
                    {p.affiliations?.map((a) => (
                      <Link
                        className="credential-entry"
                        key={a.id}
                        href={"/providers/" + a.slug}
                      >
                        {a.name} →
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
            <section className="card" id="reviews">
              <div className="section-head">
                <h2>Patient Reviews</h2>
                <Link className="button secondary small" href="/dashboard">
                  Write a Review
                </Link>
              </div>
              {summary?.review_count > 0 && (
                <p className="review-score">
                  <span>★</span> <strong>{summary.rating}</strong> out of 5 ·{" "}
                  {summary.review_count} published reviews
                </p>
              )}
              <div className="profile-reviews">
                {reviews.map((r: any) => (
                  <article key={r.id}>
                    <p>“{r.comment}”</p>
                    <span className="review-score">{"★".repeat(r.rating)}</span>
                    <strong>{r.patient_name}</strong>
                    <small>
                      {new Date(r.created_at).toLocaleDateString("en-AE", {
                        timeZone: "Asia/Dubai",
                      })}
                    </small>
                  </article>
                ))}
              </div>
              {!reviews.length && (
                <p>
                  No published patient reviews yet. Patients can review
                  completed appointments from their dashboard.
                </p>
              )}
            </section>
            <section className="card" id="locations">
              <h2>Locations & Opening Hours</h2>
              <p>{p.address || p.area || "Address not supplied"}</p>
              <div className="profile-credentials">
                <div>
                  {business.branches.map((b: any) => (
                    <div className="detail-item" key={b.id}>
                      <h3>{b.name}</h3>
                      <p>
                        {b.address} · {b.city}, {b.country}
                      </p>
                      {b.phone && (
                        <a className="link" href={"tel:" + b.phone}>
                          Call Branch
                        </a>
                      )}
                      {b.latitude !== null && b.longitude !== null && (
                        <a
                          className="link"
                          target="_blank"
                          rel="noreferrer"
                          href={`https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=17/${b.latitude}/${b.longitude}`}
                        >
                          {" "}
                          · View Map ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  {business.hours.map((h: any) => (
                    <div className="row spread opening-row" key={h.id}>
                      <span>
                        {
                          [
                            "Sunday",
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ][h.weekday]
                        }
                      </span>
                      <strong>
                        {h.opens.slice(0, 5)}–{h.closes.slice(0, 5)}
                      </strong>
                    </div>
                  ))}
                  {!business.hours.length && (
                    <p>
                      {d.openingHours ||
                        "Opening hours have not been supplied."}
                    </p>
                  )}
                </div>
              </div>
            </section>
            <section className="card" id="gallery">
              <h2>
                {lab
                  ? "Laboratory Gallery"
                  : facility
                    ? "Facilities & Gallery"
                    : "Gallery"}
              </h2>
              <div className="profile-gallery">
                {business.media.map((m: any) => (
                  <figure key={m.id}>
                    <a
                      href={"/v1/care/public/media/" + m.id}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={"/v1/care/public/media/" + m.id}
                        alt={m.caption || p.name}
                      />
                    </a>
                    <figcaption>{m.caption}</figcaption>
                  </figure>
                ))}
              </div>
              {!business.media.length && (
                <p>No gallery images have been published.</p>
              )}
            </section>
          </div>
          <aside className="reference-profile-side">
            <ProfileBooking slug={p.slug} services={services} />
            <section className="card">
              <h2>Contact {p.name}</h2>
              {p.phone && (
                <a className="button secondary" href={"tel:" + p.phone}>
                  Call {p.phone}
                </a>
              )}
              {p.website && (
                <a
                  className="link"
                  href={p.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit Website ↗
                </a>
              )}
              <ProviderActions id={p.id} slug={p.slug} name={p.name} />
            </section>
            <DirectoryMap providers={[p]} />
            {d.insurance && (
              <section className="card">
                <h2>Insurance Information</h2>
                <p>{d.insurance}</p>
                <small>
                  Confirm your plan and service coverage with the provider.
                </small>
              </section>
            )}
            {p.affiliations?.length ? (
              <section className="card">
                <h2>Clinic & Hospital Affiliations</h2>
                {p.affiliations.map((a) => (
                  <Link
                    className="detail-item link"
                    key={a.id}
                    href={"/providers/" + a.slug}
                  >
                    {a.name} →
                  </Link>
                ))}
              </section>
            ) : null}
            {related.length > 0 && (
              <section className="card">
                <h2>More in {p.area || "the Directory"}</h2>
                {related.map((r: Provider) => (
                  <Link
                    className="profile-related"
                    href={"/providers/" + r.slug}
                    key={r.id}
                  >
                    <Avatar name={r.name} url={r.details?.photoUrl} />
                    <span>
                      <strong>{r.name}</strong>
                      <small>{r.specialty}</small>
                    </span>
                  </Link>
                ))}
              </section>
            )}
            <section className="card">
              <h2>Is this your practice?</h2>
              <p>
                Claim your listing to keep your business information up to date.
              </p>
              <Link
                className="button small"
                href={`/claim-listing?provider=${p.id}`}
              >
                Claim This Listing →
              </Link>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
