import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { STOREFRONT_URL } from "@/lib/site";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { localized } from "@/lib/localize";
import { ProductForm } from "@/components/product-form";
import { VariantManager } from "@/components/variant-manager";

interface Category { id: string; name: string; slug: string; parentId: string | null }
interface Collection { id: string; name: string; slug: string }
interface Brand { id: string; name: string; slug: string }

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string;
  brandId: string | null;
  status: string;
  visibility: string;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  material: string | null;
  careInstructions: string | null;
  fitNotes: string | null;
  features: string[];
  tags: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  nameEn: string | null;
  shortDescriptionEn: string | null;
  descriptionEn: string | null;
  materialEn: string | null;
  careInstructionsEn: string | null;
  fitNotesEn: string | null;
  featuresEn: string[];
  tagsEn: string[];
  metaTitleEn: string | null;
  metaDescriptionEn: string | null;
  isFeatured: boolean;
  images: Array<{ id: string; url: string; alt: string; color: string | null }>;
  categories: Array<{ categoryId: string }>;
  collections: Array<{ collectionId: string }>;
  variants: Array<{
    id: string; sku: string; size: string | null; color: string | null; colorHex: string | null;
    isActive: boolean; priceOverride: string | null;
    inventory: Array<{ warehouse: { name: string; code: string }; onHand: number; reserved: number; damaged: number }>;
  }>;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { t, locale } = await getI18n();
  const { id } = await params;
  const cookie = await getCookieHeader();
  const [product, categories, collections, brands] = await Promise.all([
    apiGet<AdminProduct>(`/admin/catalog/products/${id}`, { cookie }),
    apiGet<Category[]>("/admin/catalog/categories", { cookie }),
    apiGet<Collection[]>("/admin/catalog/collections", { cookie }),
    apiGet<Brand[]>("/admin/catalog/brands", { cookie }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title={localized(locale, product.name, product.nameEn)}
        description={t("{sku} · {count} variants", { sku: product.sku, count: product.variants.length })}
        back={{ href: "/products", label: "Products" }}
        actions={
          <Link href={`${STOREFRONT_URL}/products/${product.slug}`} target="_blank" className="a-btn a-btn-outline">
            {t("View on storefront")}
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted">
        <Badge status={product.status} />
        <span>{t(product.visibility === "PUBLIC" ? "Public" : "Hidden")}</span>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        categories={categories ?? []}
        collections={collections ?? []}
        brands={brands ?? []}
      />
      <VariantManager productId={product.id} variants={product.variants} />
    </div>
  );
}
