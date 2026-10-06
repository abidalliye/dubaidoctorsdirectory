import type { Metadata } from "next";
import { brand, tagline } from "../lib/brand";
import { SiteChrome } from "../components/site-chrome";
import {BrandProvider} from '../components/brand-context';
import {getSiteBrand} from '../lib/server-brand';
import "./globals.css";
export async function generateMetadata():Promise<Metadata>{const brand=await getSiteBrand();return {
  title: {
    default: `${brand} | Healthcare directory`,
    template: `%s | ${brand}`,
  },
  description:
    "Find doctors, hospitals, clinics and laboratories in Dubai. Compare profiles and book available care.",
};}
export default async function Layout({ children }: { children: React.ReactNode }) {
  const name=await getSiteBrand();
  return (
    <html lang="en">
      <body>
        <BrandProvider initialBrand={name}><SiteChrome brand={name} tagline={tagline}>
          {children}
        </SiteChrome></BrandProvider>
      </body>
    </html>
  );
}
