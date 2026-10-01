import Link from "next/link";
export default function Home() {
  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="mb-6 text-xs font-bold tracking-[.2em] text-teal-700">
            YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h1 className="max-w-2xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Find care for your
            <br />
            <span className="text-teal-600">fertility journey.</span>
          </h1>
          <p className="my-7 max-w-lg text-lg leading-8 text-slate-500">
            Explore Dubai’s fertility doctors and clinics. Find the right
            services, in the right place, at your own pace.
          </p>
          <form
            action="/directory"
            className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <label className="sr-only" htmlFor="q">
              Search providers
            </label>
            <input
              id="q"
              name="q"
              placeholder="Doctor, clinic or treatment"
              className="min-w-0 flex-1 rounded-xl px-4 py-3"
            />
            <button className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white">
              Find care →
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
            Explore:{" "}
            {["IVF", "ICSI", "Egg Freezing"].map((q) => (
              <Link
                key={q}
                href={`/directory?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-slate-200 px-3 py-1 hover:bg-white"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
        <aside className="flex flex-col justify-center rounded-[2rem] bg-[#e3f2ed] p-10">
          <div className="mb-12 text-7xl text-teal-700" aria-hidden="true">
            ✳
          </div>
          <p className="text-3xl font-medium leading-snug">
            A little clarity.
            <br />A little confidence.
            <br />A step forward.
          </p>
          <p className="mt-6 leading-7 text-slate-600">
            Thoughtfully organized provider information to make your search for
            care feel simpler.
          </p>
        </aside>
      </section>
      <section className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-bold tracking-widest text-teal-700">
          EXPLORE YOUR OPTIONS
        </p>
        <h2 className="mt-3 text-3xl font-semibold">
          Care that meets you where you are
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            [
              "doctor",
              "Find a specialist",
              "Explore doctors by specialty and location.",
            ],
            [
              "clinic",
              "Explore clinics",
              "Compare fertility centres and their services.",
            ],
            ["", "Browse all care", "Discover providers across Dubai."],
          ].map(([kind, title, description]) => (
            <Link
              key={title}
              href={`/directory${kind ? `?kind=${kind}` : ""}`}
              className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-teal-600"
            >
              <h3 className="text-xl font-semibold">{title} ↗</h3>
              <p className="mt-4 leading-7 text-slate-500">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
