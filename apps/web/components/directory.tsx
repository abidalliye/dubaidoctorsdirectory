import {postImage} from '../lib/blog';
import Link from "next/link";
import { list, publicData, Provider } from "../lib/api";
import { Avatar, ProviderCard } from "./provider-card";
import { Icon } from "./icon";
import { DirectoryMap } from "./directory-map";
type Summary = {
  id: string;
  price_minor: number | null;
  modes: string[] | null;
  next_slot: string | null;
  rating: number | null;
  review_count: number;
};
const money = (n: number) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n / 100);
const date = (s: string) =>
  new Date(s).toLocaleString("en-AE", {
    timeZone: "Asia/Dubai",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
function ResultRow({
  provider: p,
  summary: s,
}: {
  provider: Provider;
  summary?: Summary;
}) {
  return (
    <article
      className={`card search-result ${["doctor", "surgeon", "technician"].includes(p.kind) ? "professional-result" : "facility-result"}`}
    >
      <div className="result-photo">
        <Avatar name={p.name} url={p.details?.photoUrl} large />
        {s?.next_slot && (
          <span className="slot-chip">Next: {date(s.next_slot)}</span>
        )}
      </div>
      <div className="result-description">
        <Link href={`/providers/${p.slug}`}>
          <h3>
            {p.name}{" "}
            {p.verified && (
              <span className="verified-mark" title="Verified listing">
                ✓
              </span>
            )}
          </h3>
        </Link>
        <p>{p.specialty || p.kind}</p>
        {p.details?.qualifications && <small>{p.details.qualifications}</small>}
        {s && s.review_count > 0 ? (
          <p className="review-score">
            <span>★</span> <strong>{s.rating}</strong>{" "}
            <small>({s.review_count} published reviews)</small>
          </p>
        ) : (
          <small>No published reviews</small>
        )}
        <div className="result-tags">
          {p.services.slice(0, 4).map((v) => (
            <span className="tag" key={v}>
              {v}
            </span>
          ))}
        </div>
        <p className="result-location">
          ⌖ {p.address || p.area || "Location not supplied"}
        </p>
        <div className="result-meta">
          {s?.modes?.length ? <span>{s.modes.join(" · ")}</span> : null}
          {p.details?.languages && <span>Speaks: {p.details.languages}</span>}
        </div>
      </div>
      <div className="result-booking">
        {s?.price_minor != null ? (
          <>
            <strong>{money(s.price_minor)}</strong>
            <small>Services from</small>
          </>
        ) : (
          <small>Fees not published</small>
        )}
        <Link className="button small" href={`/book/${p.slug}`}>
          Book Appointment
        </Link>
        <Link className="button secondary small" href={`/providers/${p.slug}`}>
          View Profile
        </Link>
      </div>
    </article>
  );
}
export async function DirectoryView({
  params = {},
  title = "Find doctors, clinics and hospitals",
}: {
  params?: Record<string, string>;
  title?: string;
}) {
  const kind = params.kind || "",
    professional = ["doctor", "surgeon", "technician"].includes(kind),
    facility = ["hospital", "clinic", "lab"].includes(kind);
  const route =
    kind === "doctor"
      ? "/doctors"
      : kind === "hospital"
        ? "/hospitals"
        : kind === "clinic"
          ? "/clinics"
          : kind === "lab"
            ? "/laboratories"
            : "/directory";
  let result;
  try {
    result = await list(params);
  } catch {
    return (
      <main className="container section">
        <h1>{title}</h1>
        <p className="error">
          Directory temporarily unavailable. Please try again.
        </p>
        <Link className="button" href={route}>
          Try Again
        </Link>
      </main>
    );
  }
  const [taxonomy, summary, articles, hospitals, clinics] = await Promise.all([
    publicData("care/public/taxonomy?"+new URLSearchParams({kind})).catch(() => ({
      specialties: [],
      locations: [],
    })),
    publicData(
      "care/public/provider-summaries?" +
        new URLSearchParams({ ids: result.items.map((p) => p.id).join(",") }),
    ).catch(() => ({ items: [] })),
    publicData("content/articles").catch(() => ({ items: [] })),
    professional
      ? list({ kind: "hospital", limit: "4" }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
    professional
      ? list({ kind: "clinic", limit: "4" }).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);
  const summaries = new Map<string, Summary>(
    summary.items.map((s: Summary) => [s.id, s]),
  );
  const link = (changes: Record<string, string>) =>
    route + "?" + new URLSearchParams({ ...params, page: "1", ...changes });
  return (
    <div
      className={`directory-page ${professional ? "doctor-directory" : facility ? "facility-directory" : "all-directory"}`}
    >
      <section className="search-hero">
        <div className="container">
          <p className="breadcrumb">
            <Link href="/">Home</Link> › {kind ? title : "Directory"}
          </p>
          <h1>{title}</h1>
          <p>
            Search by specialty, location, services and appointment
            availability.
          </p>
          <div className="search-benefits">
            {[
              ["user", "Provider profiles"],
              ["calendar", "Online booking"],
              ["star", "Patient reviews"],
              ["card", "Published service fees"],
            ].map(([icon, text]) => (
              <span key={text}>
                <Icon name={icon} />
                {text}
              </span>
            ))}
          </div>
          <div className="search-mode-tabs">
            <Link
              className={!params.mode ? "active" : ""}
              href={link({ mode: "" })}
            >
              All{" "}
              {professional ? "Doctors" : facility ? "Facilities" : "Providers"}
            </Link>
            <Link
              className={params.mode === "In clinic" ? "active" : ""}
              href={link({ mode: "In clinic" })}
            >
              In-Clinic Visit
            </Link>
            <Link href="/video-consultation">Video Consultation</Link>
            <Link
              className={params.mode === "Home visit" ? "active" : ""}
              href={link({ mode: "Home visit" })}
            >
              Home Visit
            </Link>
          </div>
          <form className="directory-searchbar" action={route}>
            {kind && <input type="hidden" name="kind" value={kind} />}
            <input
              className="field"
              name="q"
              aria-label="Search providers"
              placeholder="Name or specialty"
              defaultValue={params.q}
            />
            <select
              className="field"
              name="area"
              aria-label="City or area"
              defaultValue={params.area || ""}
            >
              <option value="">All locations</option>
              {taxonomy.locations.map((t: any) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
            <select
              className="field"
              name="specialty"
              aria-label="Specialty"
              defaultValue={params.specialty || ""}
            >
              <option value="">All specialties</option>
              {taxonomy.specialties.map((t: any) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
            <button className="button">
              <Icon name="search" size={17} /> Search
            </button>
          </form>
        </div>
      </section>
      {facility && (
        <div className="container facility-specialties">
          {taxonomy.specialties.slice(0, 8).map((t: any) => (
            <Link key={t.name} href={link({ specialty: t.name })}>
              <span className="icon-tile">
                <Icon name={kind === "lab" ? "lab" : "hospital"} />
              </span>
              <strong>{t.name}</strong>
            </Link>
          ))}
        </div>
      )}
      <main className="container search-columns">
        <aside className="card search-filters">
          <div className="card-head">
            <h3>Filters</h3>
            <Link className="link" href={route}>
              Clear All
            </Link>
          </div>
          <form action={route}>
            <input
              className="field"
              name="q"
              placeholder="Name or specialty"
              aria-label="Search providers"
              defaultValue={params.q}
            />
            <select
              className="field"
              name="kind"
              aria-label="Provider type"
              defaultValue={kind}
            >
              <option value="">All providers</option>
              {[
                "doctor",
                "surgeon",
                "clinic",
                "hospital",
                "lab",
                "technician",
              ].map((k) => (
                <option key={k} value={k}>
                  {k[0].toUpperCase() + k.slice(1)}
                </option>
              ))}
            </select>
            <input
              className="field"
              name="area"
              placeholder="City or area"
              aria-label="City or area"
              defaultValue={params.area}
            />
            <select
              className="field"
              name="specialty"
              aria-label="Specialty"
              defaultValue={params.specialty || ""}
            >
              <option value="">All specialties</option>
              {taxonomy.specialties.map((t: any) => (
                <option key={t.name} value={t.name}>
                  {t.name} ({t.count})
                </option>
              ))}
            </select>
            <select
              className="field"
              name="mode"
              aria-label="Consultation type"
              defaultValue={params.mode || ""}
            >
              <option value="">Consultation type</option>
              <option>In clinic</option>
              <option>Home visit</option>
            </select>
            <select
              className="field"
              name="available"
              aria-label="Appointment availability"
              defaultValue={params.available || ""}
            >
              <option value="">Any availability</option>
              <option value="true">Has open slots</option>
            </select>
            <input
              className="field"
              name="insurance"
              aria-label="Insurance provider"
              placeholder="Insurance provider"
              defaultValue={params.insurance}
            />
            <input
              className="field"
              name="maxFee"
              type="number"
              min="0"
              max="100000"
              step="0.01"
              placeholder="Maximum fee AED"
              aria-label="Maximum service fee in AED"
              defaultValue={params.maxFee}
            />
            <select
              className="field"
              name="verified"
              aria-label="Listing verification"
              defaultValue={params.verified || ""}
            >
              <option value="">All listings</option>
              <option value="true">Verified listings</option>
            </select>
            <select
              className="field"
              name="sort"
              aria-label="Sort results"
              defaultValue={params.sort || "name"}
            >
              <option value="name">Name A–Z</option>
              <option value="newest">Newest listings</option>
              <option value="fee">Lowest service price</option>
            </select>
            <button className="button">Apply Filters</button>
          </form>
        </aside>
        <section className="search-main">
          <div className="section-head">
            <h2>
              {result.total}{" "}
              {professional ? "doctors" : facility ? "facilities" : "providers"}{" "}
              found
            </h2>
            <Link className="link" href="/doctors/compare">
              Compare Doctors →
            </Link>
          </div>
          <p className="result-sort">
            Page {result.page} ·{" "}
            {params.sort === "fee"
              ? "Lowest service price"
              : params.sort === "newest"
                ? "Newest listings first"
                : "Name A–Z"}
          </p>
          <div className="search-results">
            {result.items.map((p) => (
              <ResultRow
                key={p.id}
                provider={p}
                summary={summaries.get(p.id)}
              />
            ))}
          </div>
          {!result.total && (
            <div className="empty">
              No matching providers. Try a different specialty or area.
            </div>
          )}
          <nav className="search-pagination" aria-label="Pagination">
            {result.page > 1 && (
              <Link
                className="button secondary small"
                href={link({ page: String(result.page - 1) })}
              >
                ← Previous
              </Link>
            )}
            <span className="badge">{result.page}</span>
            {result.page * result.limit < result.total && (
              <Link
                className="button small"
                href={link({ page: String(result.page + 1) })}
              >
                Next →
              </Link>
            )}
          </nav>
          {[
            { items: hospitals.items, label: "Hospitals", url: "/hospitals" },
            { items: clinics.items, label: "Clinics", url: "/clinics" },
          ].map(
            ({ items, label, url }) =>
              items.length > 0 && (
                <section className="related-facilities" key={label}>
                  <div className="section-head">
                    <h3>Explore {label}</h3>
                    <Link className="link" href={url}>
                      View All →
                    </Link>
                  </div>
                  <div>
                    {items.map((p: Provider) => (
                      <ProviderCard key={p.id} provider={p} />
                    ))}
                  </div>
                </section>
              ),
          )}
        </section>
        <aside className="search-sidebar">
          <DirectoryMap providers={result.items} />
          <section className="card">
            <h3>Popular Specialties</h3>
            <div className="specialty-links">
              {[...taxonomy.specialties]
                .sort((a: any, b: any) => b.count - a.count)
                .slice(0, 8)
                .map((t: any) => (
                  <Link key={t.name} href={link({ specialty: t.name })}>
                    <Icon name="heart" size={19} />
                    <span>{t.name}</span>
                    <small>({t.count})</small>
                  </Link>
                ))}
            </div>
            <Link className="link" href="/specialties">
              View All Specialties →
            </Link>
          </section>
          <section className="card directory-help">
            <Icon name="heart" size={30} />
            <h3>Find the right care</h3>
            <p>
              Explore specialties and provider profiles to compare your options.
            </p>
            <Link className="button secondary small" href="/specialties">
              Explore Specialties
            </Link>
          </section>
          {articles.items.length > 0 && (
            <section className="card">
              <h3>Latest Health Articles</h3>
              <div className="directory-articles">
                {articles.items.slice(0, 3).map((r: any) => (
                  <Link key={r.id} href={"/blog/" + r.data.slug}>
                    {postImage(r) && <img src={postImage(r)} alt={r.data.imageAlt||""} />}
                    <strong>{r.data.title}</strong>
                    <small>{r.data.category}</small>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </main>
      <section className="container directory-bottom">
        <div className="card">
          <h3>Booking appointments</h3>
          <details>
            <summary>How do I book?</summary>
            <p>
              Choose a provider, service and open slot, then sign in to submit
              your request. Your appointment stays requested until confirmed by
              the provider.
            </p>
          </details>
          <details>
            <summary>Can I change my booking?</summary>
            <p>
              Open Appointments in your dashboard to view available cancellation
              and rescheduling actions.
            </p>
          </details>
        </div>
        <div className="card">
          <h3>Your healthcare, in one place</h3>
          <p>
            Compare provider information, save your favourites and manage your
            appointments from your account.
          </p>
          <Link className="link" href="/dashboard">
            Open Dashboard →
          </Link>
        </div>
        <div className="card">
          <h3>List Your Practice</h3>
          <p>
            Publish your services and availability, and help patients find your
            practice.
          </p>
          <Link className="button small" href="/listings/new">
            List Your Practice →
          </Link>
        </div>
      </section>
    </div>
  );
}
