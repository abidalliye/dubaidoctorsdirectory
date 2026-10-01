import Link from "next/link";
import { list } from "../../lib/api";
export const metadata = { title: "Explore providers" };
export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params: Record<string, string> = {};
  for (const key of ["q", "kind", "area", "page"])
    if (typeof raw[key] === "string") params[key] = raw[key] as string;
  let result;
  try {
    result = await list(params);
  } catch {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-3xl">The directory is temporarily unavailable</h1>
        <p className="mt-4">Please try again shortly.</p>
        <Link href="/directory" className="mt-5 inline-block text-teal-700">
          Try again →
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <p className="text-xs font-bold tracking-widest text-teal-700">
        FIND YOUR CARE
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Dubai provider directory</h1>
      <form className="my-8 flex flex-wrap gap-3 rounded-2xl bg-white p-4">
        <label className="flex flex-1 flex-col gap-2 text-sm">
          Search
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Name or treatment"
            className="rounded-lg border border-slate-200 p-3"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Provider type
          <select
            name="kind"
            defaultValue={params.kind || ""}
            className="rounded-lg border border-slate-200 p-3"
          >
            <option value="">All providers</option>
            <option value="doctor">Doctors</option>
            <option value="clinic">Clinics</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Area
          <input
            name="area"
            defaultValue={params.area}
            placeholder="e.g. Jumeirah"
            className="rounded-lg border border-slate-200 p-3"
          />
        </label>
        <button className="self-end rounded-lg bg-teal-700 p-3 text-white">
          Search
        </button>
      </form>
      <p className="mb-6 text-slate-500">
        {result.total} providers · Confirm listing details directly with
        providers
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {result.items.map((p) => (
          <Link
            href={`/providers/${p.slug}`}
            key={p.id}
            className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-teal-600"
          >
            <p className="text-xs uppercase tracking-widest text-teal-700">
              {p.kind} · {p.area}
            </p>
            <h2 className="mt-4 text-2xl font-semibold">{p.name}</h2>
            <p className="mt-3 text-slate-500">{p.specialty}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.services.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-teal-700">View provider →</p>
          </Link>
        ))}
      </div>
      {!result.total && (
        <p className="rounded-xl bg-white p-8">
          No providers match your search. Try another name, treatment or area.
        </p>
      )}
      <nav aria-label="Pagination" className="mt-8 flex gap-6">
        {result.page > 1 && (
          <Link
            href={`?${new URLSearchParams({ ...params, page: String(result.page - 1) })}`}
          >
            ← Previous
          </Link>
        )}
        {result.page * result.limit < result.total && (
          <Link
            href={`?${new URLSearchParams({ ...params, page: String(result.page + 1) })}`}
          >
            Next →
          </Link>
        )}
      </nav>
    </main>
  );
}
