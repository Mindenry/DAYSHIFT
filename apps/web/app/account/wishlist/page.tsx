import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist-view";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Your wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const { t } = await getI18n();
  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">{t("Account")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Wishlist")}</h1>
        <p className="mt-3 text-sm text-muted">Pieces you&apos;re considering. Saved to your account.</p>
      </div>
      <WishlistView />
    </div>
  );
}
