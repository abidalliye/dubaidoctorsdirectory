"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-4xl p-12">
      <h1 className="text-3xl">We couldn’t load this page</h1>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-teal-700 px-6 py-3 text-white"
      >
        Try again
      </button>
    </main>
  );
}
