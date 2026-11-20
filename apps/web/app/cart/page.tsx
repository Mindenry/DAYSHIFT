import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default async function CartPage() {
  const { t } = await getI18n();
  return (
    <div className="wrap py-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="overline text-muted">{t("Your selection")}</p>
          <h1 className="mt-2 font-display text-5xl md:text-6xl">{t("Shopping bag")}</h1>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">{t("Free returns within 30 days")}</p>
      </div>
      <CartView />
    </div>
  );
}
