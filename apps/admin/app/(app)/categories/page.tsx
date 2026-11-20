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
      <PageHeader eyebrow="Catalog" title="Categories" description="Category tree used by navigation and filters." />
      <CategoryManager initial={categories ?? []} />
    </div>
  );
}
