import type { Metadata } from "next";
import { AddressesView } from "@/components/addresses-view";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default function AddressesPage() {
  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">Account</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Addresses</h1>
      </div>
      <div className="mt-8">
        <AddressesView />
      </div>
    </div>
  );
}
