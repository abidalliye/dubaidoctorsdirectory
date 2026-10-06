import { notFound } from "next/navigation";
import { detail } from "../../../lib/api";
import { Booking } from "../../../components/booking";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = await detail((await params).slug);
  if (!p) notFound();
  return <Booking provider={p} />;
}
