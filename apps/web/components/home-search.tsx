"use client";
import { useState } from "react";
import Link from "next/link";
import { Provider } from "../lib/api";
import { ProviderCard } from "./provider-card";

export function HomeSearch({ specialties }: { specialties: string[] }) {
  const [kind, setKind] = useState("doctor");
  return <div className="home-search">
    <div className="tabs" aria-label="Search category">{[["doctor","Find Doctor"],["hospital","Find Hospital"],["clinic","Find Clinic"],["lab","Find Lab Test"]].map(([value,label]) => <button key={value} type="button" aria-pressed={kind === value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}>{label}</button>)}<Link href="/video-consultation">Video Consult</Link></div>
    <form action="/directory" className="search-grid">
      <input type="hidden" name="kind" value={kind}/>
      <input className="field" name="q" aria-label="Name or specialty" placeholder="Name or specialty" list="home-specialties"/>
      <datalist id="home-specialties">{specialties.map(s => <option key={s} value={s}/>)}</datalist>
      <input className="field" name="area" aria-label="City or area" placeholder="City or area"/>
      <button className="button">Search Now</button>
    </form>
    <div className="popular-searches"><strong>Browse specialties:</strong>{specialties.slice(0,5).map(s => <Link key={s} href={`/directory?kind=${kind}&q=${encodeURIComponent(s)}`}>{s}</Link>)}</div>
  </div>;
}

export function HomeProviders({ groups }: { groups: {label:string;href:string;items:Provider[];available:boolean}[] }) {
  const [active,setActive]=useState(0);
  const group=groups[active];
  return <section className="home-section"><div className="section-head"><div className="tabs provider-tabs">{groups.map((g,i)=><button key={g.label} aria-pressed={active===i} className={active===i?"active":""} onClick={()=>setActive(i)}>{g.label}</button>)}</div><Link className="link" href={group.href}>View All →</Link></div><div className="grid four">{group.items.map(p=><ProviderCard key={p.id} provider={p}/>)}</div>{!group.items.length&&<div className="empty">{group.available?"No published providers in this category yet.":"Listings temporarily unavailable."}</div>}</section>;
}
