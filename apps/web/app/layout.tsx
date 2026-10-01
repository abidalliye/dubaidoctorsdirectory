import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "FertiFind Dubai | Find your fertility care",
    template: "%s | FertiFind",
  },
  description:
    "Explore fertility clinics and doctors in Dubai. Compare services, locations and provider information.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-2xl font-bold tracking-tight">
              Ferti<span className="text-teal-600">Find</span>
              <span className="ml-2 text-xs font-normal text-slate-500">
                DUBAI
              </span>
            </Link>
            <Link
              href="/directory"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm text-white"
            >
              Explore directory ↗
            </Link>
          </nav>
        </header>
        {children}
        <footer className="mt-20 border-t border-slate-200 p-8 text-center text-sm text-slate-500">
          FertiFind Dubai · Information to help you explore your options.
          <br />
          Confirm credentials, services and costs directly with each provider.
        </footer>
      </body>
    </html>
  );
}
