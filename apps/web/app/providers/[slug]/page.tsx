import { notFound } from "next/navigation";
import { detail } from "../../../lib/api";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await detail((await params).slug);
  return { title: p?.name || "Provider not found" };
}
export default async function Profile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await detail((await params).slug);
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-teal-700">
        {p.kind} · {p.area}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{p.name}</h1>
      <p className="mt-4 text-xl text-slate-500">{p.specialty}</p>
      <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm">
        {p.verified
          ? "Provider information reviewed."
          : "This imported listing has not been independently verified."}{" "}
        Confirm current credentials, treatments and contact details directly.
      </p>
      <section className="mt-8 rounded-2xl bg-white p-8">
        <h2 className="text-xl font-semibold">Services</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {p.services.map((s) => (
            <li key={s} className="rounded-full bg-teal-50 px-4 py-2">
              {s}
            </li>
          ))}
        </ul>
        <h2 className="mt-8 text-xl font-semibold">Location & contact</h2>
        <p className="mt-4 text-slate-600">{p.address}</p>
        {p.phone && (
          <a
            className="mt-5 inline-block rounded-lg bg-teal-700 px-6 py-3 text-white"
            href={`tel:${p.phone.replace(/[^+\d]/g, "")}`}
          >
            Call provider
          </a>
        )}
        {/^https?:\/\//.test(p.website) && (
          <a
            className="ml-4 text-teal-700"
            href={p.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit website ↗
          </a>
        )}
      </section>
    </main>
  );
}
