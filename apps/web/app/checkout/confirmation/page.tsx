import type { Metadata } from "next";
import { ConfirmationView } from "@/components/confirmation-view";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = typeof params.order === "string" ? params.order : "";
  return <ConfirmationView orderNumber={orderNumber} />;
}
