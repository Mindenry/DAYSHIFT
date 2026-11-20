import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { CategoryManager } from "@/components/taxonomy-managers";

export default async function CategoriesPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const categories = await apiGet<Array<{ id: string; name: string; slug: string; description: string | null; imageUrl: string | null; parentId: string | null; position: number; isActive: boolean; _count: { products: number; children: number } }>>(
    "/admin/catalog/categories",
    { cookie },
  );
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Categories" description="The navigation tree customers browse. Changes are reflected on the storefront immediately." />
      <CategoryManager initial={categories ?? []} />
    </div>
  );
}
