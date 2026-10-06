import { DirectoryView } from "../../components/directory";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params: Record<string, string> = {};
  for (const k of [
    "q",
    "kind",
    "area",
    "page",
    "insurance",
    "sort",
    "verified",
    "specialty", "mode", "maxFee", "available",
  ])
    if (typeof raw[k] === "string") params[k] = raw[k];
  return <DirectoryView params={params} />;
}
