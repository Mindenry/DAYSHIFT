import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { BrandManager } from "@/components/taxonomy-managers";

export default async function BrandsPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const brands = await apiGet<Array<{ id: string; name: string; slug: string; description: string | null; isActive: boolean; _count: { products: number } }>>(
    "/admin/catalog/brands",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Brands" description="Brand records shown on product pages." />
      <BrandManager initial={brands ?? []} />
    </div>
  );
}
