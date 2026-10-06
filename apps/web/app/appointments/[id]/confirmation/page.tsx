import { Confirmation } from "../../../../components/booking";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Confirmation id={(await params).id} />;
}
