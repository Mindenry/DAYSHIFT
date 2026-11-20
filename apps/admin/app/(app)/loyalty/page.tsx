import { PageHeader, EmptyState } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";
import { LoyaltyAdjust } from "@/components/admin-forms";

export default async function LoyaltyPage() {
  await requireStaff();
  const { t, locale } = await getI18n();
  const cookie = await getCookieHeader();
  const accounts = await apiGet<Array<{ id: string; customer: string; email: string; pointsBalance: number; lifetimePoints: number; tier: string }>>(
    "/admin/loyalty",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Loyalty" description="Points balances, tiers and manual adjustments." />
      <div className="panel overflow-hidden">
        {!accounts?.length ? <EmptyState title="No loyalty accounts yet" /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("Customer")}</th><th>{t("Email")}</th><th>{t("Tier")}</th><th className="text-right">{t("Balance")}</th><th className="text-right">{t("Lifetime")}</th><th /></tr></thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="text-xs font-medium">{account.customer}</td>
                    <td className="text-[11px] text-muted">{account.email}</td>
                    <td className="text-[11px]">{enumLabel(locale, account.tier)}</td>
                    <td className="text-right">{account.pointsBalance}</td>
                    <td className="text-right text-muted">{account.lifetimePoints}</td>
                    <td className="text-right"><LoyaltyAdjust accountId={account.id} current={account.pointsBalance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
