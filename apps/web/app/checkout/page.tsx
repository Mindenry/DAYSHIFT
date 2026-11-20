import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { CheckoutView } from "@/components/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await getSession();
  return (
    <div className="wrap py-8 md:py-12">
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">Secure checkout</p>
        <h1 className="mt-2 font-display text-4xl md:text-6xl">Checkout</h1>
      </div>
      <CheckoutView
        user={
          session
            ? { email: session.email, firstName: session.firstName, lastName: session.lastName, phone: session.phone }
            : null
        }
      />
    </div>
  );
}
