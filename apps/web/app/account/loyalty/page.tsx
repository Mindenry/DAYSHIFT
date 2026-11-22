import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import { money } from "@/lib/money";
import { getCookieHeader } from "@/lib/session";
import { getI18n } from "@/lib/i18n";

export const metadata: Metadata = { title: "Loyalty", robots: { index: false } };

interface Loyalty {
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
  valueCents: number;
  nextTier: { tier: string; pointsToGo: number; threshold: number } | null;
  transactions: Array<{ id: string; type: string; points: number; reason: string; createdAt: string }>;
}

export default async function LoyaltyPage() {
  const cookie = await getCookieHeader();
  const { t, locale } = await getI18n();
  const loyalty = await apiGet<Loyalty>("/account/loyalty", { cookie, revalidate: 0 });
  if (!loyalty) return <p className="text-sm text-muted">{t("Loyalty is temporarily unavailable.")}</p>;

  return (
    <div>
      <div className="border-b border-line pb-6">
        <p className="overline text-muted">{t("Account")}</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">{t("Loyalty")}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          {t("Earn 1 point for every ฿20 spent. 100 points is worth ฿100. Points are added when an order is paid.")}
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="border border-line p-6">
          <p className="overline text-muted">{t("Balance")}</p>
          <p className="mt-3 font-display text-5xl">{loyalty.pointsBalance}</p>
          <p className="text-xs text-muted">{t("points")} · {money(loyalty.valueCents / 100)} {t("value")}</p>
        </div>
        <div className="border border-line p-6">
          <p className="overline text-muted">{t("Tier")}</p>
          <p className="mt-3 font-display text-3xl capitalize">{loyalty.tier.toLowerCase()}</p>
          <p className="mt-1 text-xs text-muted">{loyalty.lifetimePoints} {t("lifetime points")}</p>
        </div>
        <div className="border border-line p-6">
          <p className="overline text-muted">{t("Next tier")}</p>
          {loyalty.nextTier ? (
            <>
              <p className="mt-3 font-display text-3xl capitalize">{loyalty.nextTier.tier.toLowerCase()}</p>
              <p className="mt-1 text-xs text-muted">{loyalty.nextTier.pointsToGo} {t("points to go")}</p>
            </>
          ) : (
            <p className="mt-3 font-display text-3xl">{t("Top tier")}</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="border-b border-line pb-3 font-display text-2xl">{t("Activity")}</h2>
        {loyalty.transactions.length === 0 ? (
          <p className="py-10 text-sm text-muted">{t("No points activity yet.")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {loyalty.transactions.map((transaction) => (
              <li key={transaction.id} className="flex items-center justify-between gap-4 py-4 text-sm">
                <div>
                  <p className="capitalize">{transaction.reason}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(transaction.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <p className={transaction.points >= 0 ? "" : "text-muted"}>
                  {transaction.points >= 0 ? "+" : ""}{transaction.points} {t("pts")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 border border-line p-6 text-sm leading-relaxed text-muted">
        <p className="overline">{t("How it works")}</p>
        <ul className="mt-3 space-y-2">
          <li>· {t("Points are earned on the merchandise total after discounts, excluding shipping and tax.")}</li>
          <li>· {t("Points are awarded once per paid order and never duplicated by payment webhook retries.")}</li>
          <li>· {t("Redemptions start at 500 points. Contact customer care to redeem against an order.")}</li>
          <li>· {t("Points do not expire while your account remains active.")}</li>
        </ul>
      </div>
    </div>
  );
}
