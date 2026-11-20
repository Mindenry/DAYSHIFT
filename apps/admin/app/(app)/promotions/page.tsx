import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { PromotionManager } from "@/components/admin-forms";

export default async function PromotionsPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const promotions = await apiGet<Array<{ id: string; name: string; type: string; value: string; scope: string; priority: number; isActive: boolean; startsAt: string; endsAt: string }>>(
    "/admin/promotions",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Promotions" description="Scheduled campaigns and storefront promotions." />
      <PromotionManager initial={promotions ?? []} />
    </div>
  );
}
