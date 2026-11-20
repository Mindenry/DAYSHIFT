import { PageHeader } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { ProductForm } from "@/components/product-form";

interface Category { id: string; name: string; slug: string; parentId: string | null }
interface Collection { id: string; name: string; slug: string }
interface Brand { id: string; name: string; slug: string }

export default async function NewProductPage() {
  await requireStaff();
  const cookie = await getCookieHeader();
  const [categories, collections, brands] = await Promise.all([
    apiGet<Category[]>("/admin/catalog/categories", { cookie }),
    apiGet<Collection[]>("/admin/catalog/collections", { cookie }),
    apiGet<Brand[]>("/admin/catalog/brands", { cookie }),
  ]);
  return (
    <div>
      <PageHeader eyebrow="Catalog" title="New product" description="Create the product record, then manage stock and variants." back={{ href: "/products", label: "Products" }} />
      <ProductForm mode="create" categories={categories ?? []} collections={collections ?? []} brands={brands ?? []} />
    </div>
  );
}
