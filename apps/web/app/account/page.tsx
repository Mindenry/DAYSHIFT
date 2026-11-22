import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import { money } from "@/lib/money";
import { getCookieHeader } from "@/lib/session";
import { statusLabel } from "@/lib/order-status";
import { getI18n } from "@/lib/i18n";

interface Overview {
  orderCount: number;
  wishlistCount: number;
  openReturns: number;
  unreadNotifications: number;
  addressCount: number;
  loyalty: { pointsBalance: number; tier: string; nextTier: { tier: string; pointsToGo: number } | null; valueCents: number };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    grandTotal: string;
    currency: string;
    createdAt: string;
  }>;
}

export default async function AccountOverviewPage() {
  const cookie = await getCookieHeader();
  const { t, locale } = await getI18n();
  const overview = await apiGet<Overview>("/account/overview", { cookie, revalidate: 0 });
  if (!overview) {
    return <p className="text-sm text-muted">{t("Your account could not be loaded. Please sign in again.")}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="overline text-muted">{t("Overview")}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Welcome back.")}</h1>
        </div>
        <Link href="/collections/new-arrivals" className="btn btn-outline !min-h-10 !px-4">{t("Shop new arrivals")}</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("Orders"), value: String(overview.orderCount), href: "/account/orders" },
          { label: t("Open returns"), value: String(overview.openReturns), href: "/account/returns" },
          { label: t("Saved pieces"), value: String(overview.wishlistCount), href: "/account/wishlist" },
          { label: t("Addresses"), value: String(overview.addressCount), href: "/account/addresses" },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="group border border-line p-5 transition-colors hover:border-ink">
            <p className="overline text-muted">{card.label}</p>
            <p className="mt-3 font-display text-4xl">{card.value}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-muted group-hover:text-ink">
              {t("View")} <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
        <section>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-display text-2xl">{t("Recent orders")}</h2>
            <Link href="/account/orders" className="overline link-underline">{t("All orders")}</Link>
          </div>
          {overview.recentOrders.length === 0 ? (
            <div className="border-b border-line py-12 text-center text-sm text-muted">
              {t("No orders yet. Your first piece is waiting.")}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {overview.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/account/orders/${order.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-sand/30">
                    <div>
                      <p className="text-sm">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {new Date(order.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{money(order.grandTotal)}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-[0.08em] text-muted">{t(statusLabel(order.status))}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <div className="border border-line p-6">
            <p className="overline text-muted">{t("Loyalty")}</p>
            <p className="mt-3 font-display text-5xl">{overview.loyalty.pointsBalance}</p>
            <p className="text-xs text-muted">{t("points")} · {money(overview.loyalty.valueCents / 100)} {t("value")}</p>
            <p className="mt-4 inline-flex border border-line px-3 py-1 text-[10px] uppercase tracking-[0.14em]">
              {overview.loyalty.tier}
            </p>
            {overview.loyalty.nextTier && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                {t("{count} points to {tier}.", { count: overview.loyalty.nextTier.pointsToGo, tier: overview.loyalty.nextTier.tier })}
              </p>
            )}
            <Link href="/account/loyalty" className="mt-5 inline-flex text-xs underline">{t("View activity")}</Link>
          </div>
          <div className="mt-4 border border-line p-6">
            <p className="overline text-muted">{t("Need a hand?")}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t("Our customer care team can help with sizing, delivery and returns.")}
            </p>
            <Link href="/account/support" className="btn btn-outline mt-4 w-full !min-h-10">{t("Contact care")}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
