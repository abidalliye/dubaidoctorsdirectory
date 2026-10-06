export type Provider = {
  id: string;
  slug: string;
  name: string;
  kind: "doctor" | "clinic" | "hospital" | "lab" | "surgeon" | "technician";
  specialty: string;
  area: string;
  address: string;
  services: string[];
  phone: string;
  website: string;
  verified: boolean;
  details: Record<string, string>;
  affiliations?: { id: string; name: string; slug: string }[];
};
export type Results = {
  items: Provider[];
  total: number;
  page: number;
  limit: number;
};
// Keep preview SSR requests on the matching deploy's API.
const base =
  process.env.API_URL ||
  process.env.DEPLOY_URL ||
  process.env.URL ||
  "https://fertifind-dubai.netlify.app";
export async function publicData(path: string) {
  const r = await fetch(`${base}/v1/${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error("This service is temporarily unavailable");
  return r.json();
}
export async function list(
  params: Record<string, string> = {},
): Promise<Results> {
  const response = await fetch(
    `${base}/v1/providers?${new URLSearchParams(params)}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!response.ok) throw new Error("Directory temporarily unavailable");
  return response.json();
}
export async function detail(slug: string): Promise<Provider | null> {
  const response = await fetch(
    `${base}/v1/providers/${encodeURIComponent(slug)}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Provider temporarily unavailable");
  return response.json();
}
