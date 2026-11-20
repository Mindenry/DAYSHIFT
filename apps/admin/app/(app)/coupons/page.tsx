import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { CouponManager } from "@/components/admin-forms";

export default async function CouponsPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const coupons = await apiGet<Array<{ id: string; code: string; description: string | null; type: string; value: string; minOrderSubtotal: string; startsAt: string; endsAt: string; isActive: boolean; firstOrderOnly: boolean; _count: { redemptions: number } }>>(
    "/admin/coupons",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Marketing" title="Coupons" description="The backend validates eligibility, usage limits and stacking rules on every quote and checkout." />
      <CouponManager initial={coupons ?? []} />
    </div>
  );
}
