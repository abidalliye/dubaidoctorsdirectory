"use client";
import Link from "next/link";
import {Icon} from "./icon";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {useBrand} from './brand-context';
export function SiteChrome({
  children,
  brand: initialBrand,
  tagline,
}: {
  children: React.ReactNode;
  brand: string;
  tagline: string;
}) {
  const path = usePathname();
  const [menuOpen,setMenuOpen]=useState(false);
  useEffect(()=>setMenuOpen(false),[path]);
  const brand=useBrand()||initialBrand;
  if (path.startsWith("/dashboard")) return <>{children}</>;
  return (
    <>
      <header className="site-header">
        <nav className="container nav">
          <Link className="brand" href="/">
            <span className="brand-mark"><Icon name="heart" size={30}/></span>
            <span>
              {brand}
              <small>{tagline}</small>
            </span>
          </Link>
          <button className="public-menu-toggle button secondary small" aria-expanded={menuOpen} aria-controls="public-navigation" onClick={()=>setMenuOpen(!menuOpen)}>☰ Menu</button>
          <div id="public-navigation" className={`nav-links ${menuOpen?'public-menu-open':''}`}>
            <Link href="/doctors">Find Doctors</Link>
            <Link href="/hospitals">Hospitals</Link>
            <Link href="/clinics">Clinics</Link>
            <Link href="/lab-tests">Lab Tests</Link>
            <Link href="/specialties">Specialties</Link>
            <Link href="/blog">Health Articles</Link>
            <Link href="/dashboard">For Patients</Link>
            <Link href="/list-your-business">For Businesses</Link>
          </div>
          <div className="nav-actions">
            <Link className="button secondary small" href="/auth">
              Login
            </Link>
            <Link className="button small" href="/auth?mode=register">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>
      {children}
      <section className="join-banner">
        <div className="container row spread">
          <div>
            <h2>Join {brand} today</h2>
            <p>Find care and manage your healthcare in one place.</p>
          </div>
          <div className="row">
            <Link className="button" href="/doctors">
              Find a Doctor →
            </Link>
            <Link className="button light" href="/list-your-business">
              List Your Business →
            </Link>
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="brand">
            {brand}
            <small>{tagline}</small>
          </div>
          <div>
            <h3>Find care</h3>
            <Link href="/doctors">Doctors</Link>
            <Link href="/hospitals">Hospitals</Link>
            <Link href="/clinics">Clinics</Link>
            <Link href="/lab-tests">Laboratories & tests</Link>
          </div>
          <div>
            <h3>Explore</h3>
            <Link href="/specialties">Specialties</Link>
            <Link href="/locations">Locations</Link>
            <Link href="/insurance">Insurance</Link>
            <Link href="/healthcare-a-z">Healthcare A–Z</Link>
          </div>
          <div>
            <h3>Your account</h3>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/list-your-business">Business listings</Link>
            <Link href="/emergency-care">Emergency care</Link>
            <Link href="/blog">Health articles</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          © {new Date().getFullYear()} {brand}. Confirm credentials and services
          with the provider.
        </div>
      </footer>
    </>
  );
}
