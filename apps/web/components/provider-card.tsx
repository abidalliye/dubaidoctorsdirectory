import Link from "next/link";
import {Icon} from "./icon";
import { Provider } from "../lib/api";
export function Avatar({
  name,
  url,
  large = false,
}: {
  name: string;
  url?: string;
  large?: boolean;
}) {
  return url ? (
    <img className={`avatar ${large ? "large" : ""}`} src={url} alt={name} />
  ) : (
    <span className={`avatar ${large ? "large" : ""}`} aria-hidden="true">
      {name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
export function ProviderCard({ provider: p, compact=false }: { provider: Provider; compact?:boolean }) {
  return (
    <article className={`card provider-card ${compact?"home-provider-card":""} ${p.kind!=="doctor"?"facility-card":""}`}>
      <div className="row">
        <Avatar name={p.name} url={p.details?.photoUrl} />
        <div>
          <Link href={`/providers/${p.slug}`}>
            <h3>{p.name}</h3>
          </Link>
          <p>{p.specialty || p.kind}</p>
        </div>
      </div>
      <p>⌖ {p.area || "Location not supplied"}</p>
      {p.verified && <span className="badge">Verified listing</span>}
      <div className="row provider-services">
        {p.services.slice(0, 3).map((s) => (
          <span className="tag" key={s}>
            {s}
          </span>
        ))}
      </div>
      <Link className="button small" href={`/providers/${p.slug}`}>
        {compact?"View & Book Appointment":"View Profile & Book"}
      </Link>
    </article>
  );
}
