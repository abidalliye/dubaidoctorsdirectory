import Link from "next/link";
import {BlogIndex} from "../../components/blog-index";
import {ArticleContent} from "../../components/article-content";
import {CoverPhoto} from "../../components/cover-photo";
import {postImage,readingTime} from "../../lib/blog";
import { notFound, redirect } from "next/navigation";
import { DirectoryView } from "../../components/directory";
import { BusinessForm, ClaimForm } from "../../components/business-page";
import { Compare } from "../../components/compare";
import {getSiteBrand} from '../../lib/server-brand';
import { list, publicData } from "../../lib/api";
export const dynamic = "force-dynamic";
const kinds: Record<string, string> = {
  doctors: "doctor",
  hospitals: "hospital",
  clinics: "clinic",
  laboratories: "lab",
  professionals: "technician",
};
const titles: Record<string, string> = {
  doctors: "Find Doctors in Dubai",
  hospitals: "Hospitals in Dubai",
  clinics: "Clinics in Dubai",
  laboratories: "Laboratories in Dubai",
  professionals: "Healthcare Professionals",
  specialties: "Browse Healthcare Specialties",
  locations: "Find Healthcare Near You",
  conditions: "Symptoms & Health Conditions",
  "healthcare-a-z": "Healthcare A–Z",
  insurance: "Insurance & Healthcare Providers",
  blog: "Health Articles",
  "lab-tests": "Lab Tests & Diagnostics",
  "video-consultation": "Video Consultation",
  "emergency-care": "Emergency Care in Dubai",
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  return {
    title: titles[path[0]] || path.slice(1).join(" ") || "Healthcare Directory",
  };
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { path } = await params;
  const brand=await getSiteBrand();
  const [section, slug, area] = path;
  const raw = await searchParams;
  if (section === 'provider-profile.html') {
    if (typeof raw.slug === 'string' && raw.slug) redirect('/providers/'+encodeURIComponent(raw.slug));
    redirect('/directory');
  }
  if (section === 'content.html') {
    const kind = raw.kind === 'articles' ? 'articles' : 'pages';
    const records = (await publicData('content/'+kind+(typeof raw.slug === 'string' ? '?slug='+encodeURIComponent(raw.slug) : ''))).items;
    const record = records.find((r:any)=> !raw.id || r.id === raw.id);
    if (record?.data?.slug) redirect((kind === 'articles' ? '/blog/' : '/pages/')+encodeURIComponent(record.data.slug));
    notFound();
  }
  const query: Record<string, string> = {};
  for (const k of [
    "q",
    "area",
    "kind",
    "page",
    "insurance",
    "sort",
    "verified",
    "specialty", "mode", "maxFee", "available",
  ])
    if (typeof raw[k] === "string") query[k] = raw[k];
  if (section === "doctors" && slug === "compare") return <Compare />;
  if (section === 'doctors' && slug && area === 'booking') redirect('/book/'+encodeURIComponent(slug));
  if (section === 'listings' && slug && area === 'claim') redirect('/claim-listing?provider='+encodeURIComponent(slug));
  if (
    ["doctors", "facilities", "professionals", "hospitals", "clinics", "laboratories"].includes(
      section,
    ) &&
    slug
  )
    redirect("/providers/" + encodeURIComponent(slug));
  if (kinds[section])
    return (
      <DirectoryView
        title={titles[section]}
        params={{ ...query, kind: query.kind || kinds[section] }}
      />
    );
  if (section === "listings") return <BusinessForm providerId={area==='edit'?slug:undefined} />;
  if (section === "claim-listing") return <ClaimForm />;
  if (section === "list-your-business")
    return (
      <>
        <section className="hero">
          <div className="container">
            <span className="eyebrow">For Healthcare Businesses</span>
            <h1>Grow your healthcare presence with {brand}</h1>
            <p>
              Create your profile, publish services and manage your appointments
              in one workspace.
            </p>
            <Link
              className="button"
              style={{ marginTop: 24 }}
              href="/listings/new"
            >
              List Your Business →
            </Link>
          </div>
        </section>
        <main className="container section">
          <div className="grid four">
            {[
              ["doctor", "Doctors & Surgeons"],
              ["hospital", "Hospitals"],
              ["clinic", "Clinics"],
              ["lab", "Labs & Technicians"],
            ].map(([role, title]) => (
              <article className="card" key={role}>
                <span className="icon-tile">{role === "lab" ? "⚗" : "✚"}</span>
                <h2 style={{ margin: "20px 0 10px" }}>{title}</h2>
                <p className="muted">
                  Create a complete profile, publish your services and
                  availability, and manage care records.
                </p>
                <Link
                  className="button"
                  style={{ marginTop: 20 }}
                  href={`/auth?mode=register&role=${role}`}
                >
                  Create Account
                </Link>
              </article>
            ))}
          </div>
          <section className="card" style={{ marginTop: 25 }}>
            <h2>Independent practices are welcome</h2>
            <p className="muted" style={{ marginTop: 12 }}>
              Doctors and laboratories can register independently. Hospital or
              clinic affiliations are optional. Listings are reviewed before
              publication.
            </p>
            <Link
              className="button secondary"
              style={{ marginTop: 20 }}
              href="/claim-listing"
            >
              Claim an Existing Listing
            </Link>
          </section>
        </main>
      </>
    );
  if (section === "specialties" && slug)
    return (
      <DirectoryView
        title={`${decodeURIComponent(slug)} Specialists${area ? " in " + decodeURIComponent(area) : " in Dubai"}`}
        params={{
          ...query,
          q: decodeURIComponent(slug),
          ...(area ? { area: decodeURIComponent(area) } : {}),
        }}
      />
    );
  if (section === "locations" && slug)
    return (
      <DirectoryView
        title={`Healthcare in ${decodeURIComponent(area || slug)}`}
        params={{
          ...query,
          ...(area || slug.toLowerCase() !== "dubai"
            ? { area: decodeURIComponent(area || slug) }
            : {}),
        }}
      />
    );
  if (section === "lab-tests") {
    let result;
    try {
      result = await publicData(
        "care/public/services?" + new URLSearchParams({ q: query.q || "" }),
      );
    } catch {
      return (
        <main className="container section">
          <h1>Lab Tests & Diagnostics</h1>
          <div className="error">Test catalog temporarily unavailable.</div>
        </main>
      );
    }
    const tests = result.items.filter((s: any) => s.kind === "lab");
    const selected = slug ? tests.find((s: any) => s.id === slug) : null;
    if (slug && !selected) notFound();
    return (
      <>
        <section className="page-intro">
          <div className="container">
            <h1>{selected?.name || titles[section]}</h1>
            <p>
              Find published laboratory tests, prices and collection
              appointments.
            </p>
          </div>
        </section>
        <main className="container section">
          {selected ? (
            <div className="profile-layout">
              <section className="card">
                <h2>About This Test</h2>
                <p className="article-body" style={{ marginTop: 18 }}>
                  {selected.description ||
                    "Contact the laboratory for test details."}
                </p>
                <h3 style={{ marginTop: 25 }}>Preparation</h3>
                <p className="article-body">
                  {selected.preparation ||
                    "Confirm preparation with the laboratory."}
                </p>
              </section>
              <aside className="card">
                <h2>{selected.provider_name}</h2>
                <p>
                  {selected.area} · {selected.mode}
                </p>
                <strong style={{ display: "block", margin: "15px 0" }}>
                  AED {(selected.price_minor / 100).toFixed(2)}
                </strong>
                <Link
                  className="button"
                  href={`/book/${selected.slug}?service=${selected.id}`}
                >
                  Book This Test
                </Link>
              </aside>
            </div>
          ) : (
            <>
              <form className="row" style={{ marginBottom: 24 }}>
                <input
                  className="field"
                  name="q"
                  placeholder="Search lab tests"
                  aria-label="Search lab tests"
                  defaultValue={query.q}
                  style={{ maxWidth: 500 }}
                />
                <button className="button">Search Tests</button>
              </form>
              <div className="grid three">
                {tests.map((s: any) => (
                  <article className="card" key={s.id}>
                    <span className="icon-tile">⚗</span>
                    <h2 style={{ margin: "17px 0 10px" }}>{s.name}</h2>
                    <p className="muted">
                      {s.provider_name} · {s.area}
                    </p>
                    <div className="row spread" style={{ marginTop: 20 }}>
                      <strong>AED {(s.price_minor / 100).toFixed(2)}</strong>
                      <Link
                        className="button small"
                        href={"/lab-tests/" + s.id}
                      >
                        View Test
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
              {!tests.length && (
                <div className="empty">
                  Laboratories have not published matching tests yet.
                </div>
              )}
            </>
          )}
        </main>
      </>
    );
  }
  if (section === "blog") {
    let records:any[]=[];let error='';
    try {records=(await publicData('content/articles')).items} catch {error='Articles temporarily unavailable'}
    if(!slug)return <BlogIndex posts={records} error={error} initialQuery={typeof raw.q==='string'?raw.q:''}/>;
    const article=records.find(a=>a.id===slug||a.data.slug===slug);
    if(!article&&!error)notFound();
    if(!article)return <main className="container section"><p className="error">{error}</p></main>;
    return <main className="container section"><p className="breadcrumb"><Link href="/">Home</Link> › <Link href="/blog">Health Articles</Link> › {article.data.category||'Health'}</p><div className="blog-article-layout"><article className="blog-panel"><span className="tag">{article.data.category||'Health'}</span><h1>{article.data.title}</h1><p className="muted">By {article.data.author||'Editorial team'} · {new Date(article.updated_at).toLocaleDateString('en-AE')} · {readingTime(article)} min read</p>{postImage(article)&&<CoverPhoto src={postImage(article)} alt={article.data.imageAlt||''} position={article.data.imagePosition}/>}<p>{article.data.excerpt}</p><ArticleContent body={article.data.body} format={article.data.bodyFormat}/><div className="row">{(article.data.tags||'').split(',').filter(Boolean).map((t:string)=><Link className="tag" href={'/blog?q='+encodeURIComponent(t.trim())} key={t}>{t.trim()}</Link>)}</div></article><aside className="blog-panel"><h2>Related Articles</h2>{records.filter(a=>a.id!==article.id).slice(0,5).map(a=><Link href={'/blog/'+a.id} key={a.id}>{a.data.title} →</Link>)}<Link href="/blog">Browse all articles →</Link><Link href="/doctors">Find a healthcare provider →</Link></aside></div></main>;
  }
  if (
    [
      "specialties",
      "locations",
      "healthcare-a-z",
      "conditions",
      "insurance",
    ].includes(section) &&
    !slug
  ) {
    let taxonomy: any = { specialties: [], locations: [] };
    let records: any[] = [];
    let error = "";
    try {
      if (section === "insurance")
        records = (await list({ limit: "50" })).items
          .flatMap((p) =>
            (p.details?.insurance || "")
              .split(",")
              .map((name) => ({ name: name.trim(), count: 1 })),
          )
          .filter((r) => r.name);
      else if (section === "conditions")
        records = (await publicData("content/pages")).items
          .filter((p: any) => p.data.slug?.startsWith("condition-"))
          .map((p: any) => ({ name: p.data.title, slug: p.data.slug }));
      else {
        taxonomy = await publicData("care/public/taxonomy");
        records =
          section === "locations"
            ? taxonomy.locations
            : section === "healthcare-a-z"
              ? [...taxonomy.specialties, ...taxonomy.locations]
              : taxonomy.specialties;
      }
    } catch {
      error = "Directory information temporarily unavailable";
    }
    return (
      <>
        <section className="page-intro">
          <div className="container">
            <h1>{titles[section]}</h1>
            <p>Browse healthcare information and find matching providers.</p>
          </div>
        </section>
        <main className="container section">
          {error && <div className="error">{error}</div>}
          <div className="grid four">
            {records
              .filter(
                (r, i, all) => all.findIndex((a) => a.name === r.name) === i,
              )
              .map((r) => (
                <Link
                  className="card tile"
                  key={r.name}
                  href={
                    section === "locations"
                      ? "/locations/Dubai/" + encodeURIComponent(r.name)
                      : section === "conditions"
                        ? "/pages/" + r.slug
                        : section === "insurance"
                          ? "/directory?insurance=" + encodeURIComponent(r.name)
                          : "/specialties/" + encodeURIComponent(r.name)
                  }
                >
                  <span className="icon-tile">
                    {section === "locations" ? "⌖" : "✚"}
                  </span>
                  <h3>{r.name}</h3>
                  {r.count && <small>{r.count} listings</small>}
                </Link>
              ))}
          </div>
          {!records.length && !error && (
            <div className="empty">
              Approved information will appear here when added.
            </div>
          )}
        </main>
      </>
    );
  }
  if (section === "video-consultation")
    return (
      <>
        <section className="hero">
          <div className="container">
            <span className="eyebrow">Online Healthcare</span>
            <h1>Video Consultation</h1>
            <p>
              Video appointments will be available once a secure conferencing
              service is configured and providers publish video availability.
            </p>
            <Link className="button" style={{ marginTop: 20 }} href="/doctors">
              Find In-Person Care →
            </Link>
          </div>
        </section>
      </>
    );
  if (
    section === "pages" ||
    section === "emergency-care" ||
    section === "conditions"
  ) {
    const contentSlug = section === "emergency-care" ? "emergency-care" : slug;
    let records: any[] = [];
    let error = "";
    try {
      records = (
        await publicData(
          "content/pages?slug=" + encodeURIComponent(contentSlug || ""),
        )
      ).items;
    } catch {
      error = "Content temporarily unavailable";
    }
    const page = records[0];
    return (
      <>
        <section className="page-intro">
          <div className="container">
            <h1>{page?.data.title || titles[section] || "Information"}</h1>
          </div>
        </section>
        <main className="container section">
          <article className="card">
            {error ? (
              <div className="error">{error}</div>
            ) : page ? (
              <div className="article-body">
                {page.data.body || page.data.content}
              </div>
            ) : (
              <div className="empty">
                This information has not been published yet.
              </div>
            )}
          </article>
        </main>
      </>
    );
  }
  notFound();
}
