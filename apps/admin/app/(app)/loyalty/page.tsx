import { PageHeader, EmptyState } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { LoyaltyAdjust } from "@/components/admin-forms";

export default async function LoyaltyPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const accounts = await apiGet<Array<{ id: string; customer: string; email: string; pointsBalance: number; lifetimePoints: number; tier: string }>>(
    "/admin/loyalty",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Loyalty" description="Points are earned once per paid order on the discounted merchandise total. Adjustments are audited." />
      <div className="panel overflow-hidden">
        {!accounts?.length ? <EmptyState title="No loyalty accounts yet" /> : (
          <table>
            <thead><tr><th>Customer</th><th>Email</th><th>Tier</th><th className="text-right">Balance</th><th className="text-right">Lifetime</th><th /></tr></thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="text-xs font-medium">{account.customer}</td>
                  <td className="text-[11px] text-muted">{account.email}</td>
                  <td className="text-[11px] capitalize">{account.tier.toLowerCase()}</td>
                  <td className="text-right">{account.pointsBalance}</td>
                  <td className="text-right text-muted">{account.lifetimePoints}</td>
                  <td className="text-right"><LoyaltyAdjust accountId={account.id} current={account.pointsBalance} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
