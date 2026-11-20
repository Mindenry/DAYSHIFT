import type { Metadata } from "next";
import { AddressesView } from "@/components/addresses-view";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default async function AddressesPage() {
  const { t } = await getI18n();
  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">{t("Account")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Addresses")}</h1>
      </div>
      <div className="mt-8">
        <AddressesView />
      </div>
    </div>
  );
}
