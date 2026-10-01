export type Provider = {
  id: string;
  slug: string;
  name: string;
  kind: "doctor" | "clinic";
  specialty: string;
  area: string;
  address: string;
  services: string[];
  phone: string;
  website: string;
  verified: boolean;
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
  "http://127.0.0.1:4000";
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
