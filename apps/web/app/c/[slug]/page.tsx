export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import { ListingView, type Facets } from "@/components/listing-view";
import type { ProductCardDto } from "@dayshift/types";

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  children: Array<{ id: string; name: string; slug: string }>;
  breadcrumbs: Array<{ id: string; name: string; slug: string }>;
}

interface ProductsResponse {
  items: ProductCardDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await apiGet<CategoryResponse>(`/categories/${slug}`, { revalidate: 120 });
  if (!category) return { title: "Category" };
  return {
    title: category.metaTitle ?? `${category.name} — DAYSHIFT`,
    description: category.metaDescription ?? category.description ?? `Shop ${category.name} at DAYSHIFT.`,
    alternates: { canonical: `/c/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await apiGet<CategoryResponse>(`/categories/${slug}`, { revalidate: 120 });
  if (!category) notFound();

  const search = new URLSearchParams();
  search.set("category", slug);
  search.set("pageSize", "24");
  for (const key of ["size", "color", "minPrice", "maxPrice", "inStock", "sort", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value) search.set(key, value);
  }

  const [products, facets] = await Promise.all([
    apiGet<ProductsResponse>(`/products?${search.toString()}`, { revalidate: 30 }),
    apiGet<Facets>(`/products/facets?category=${slug}`, { revalidate: 120 }),
  ]);

  if (!products || !facets) notFound();

  return (
    <ListingView
      eyebrow="Collection"
      title={category.name}
      description={category.description}
      imageUrl={category.imageUrl}
      basePath={`/c/${category.slug}`}
      products={products.items}
      facets={facets}
      total={products.meta.total}
      page={products.meta.page}
      pageSize={products.meta.pageSize}
      params={{ ...query, category: slug }}
      breadcrumbs={category.breadcrumbs.slice(0, -1).map((crumb) => ({
        name: crumb.name,
        href: `/c/${crumb.slug}`,
      }))}
    />
  );
}
