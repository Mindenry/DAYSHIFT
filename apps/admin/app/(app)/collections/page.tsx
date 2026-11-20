import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { CollectionManager } from "@/components/taxonomy-managers";

export default async function CollectionsPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const collections = await apiGet<Array<{ id: string; name: string; slug: string; description: string | null; imageUrl: string | null; type: string; position: number; isActive: boolean; startsAt: string | null; endsAt: string | null; _count: { products: number } }>>(
    "/admin/catalog/collections",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Collections" description="Curated groups of products for the storefront." />
      <CollectionManager initial={collections ?? []} />
    </div>
  );
}
