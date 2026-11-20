import type { Metadata } from "next";
import { SandboxPayment } from "@/components/sandbox-payment";

export const metadata: Metadata = { title: "Payment — DAYSHIFT", robots: { index: false } };

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reference = typeof params.reference === "string" ? params.reference : "";
  const order = typeof params.order === "string" ? params.order : "";
  const email = typeof params.email === "string" ? params.email : "";
  const amount = typeof params.amount === "string" ? params.amount : "0.00";
  return <SandboxPayment reference={reference} orderNumber={order} email={email} amount={amount} />;
}
