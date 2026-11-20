export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet } from "@/lib/api";
import { ListingView, type Facets } from "@/components/listing-view";
import type { ProductCardDto } from "@dayshift/types";

interface CollectionResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  type: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

interface ProductsResponse {
  items: ProductCardDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await apiGet<CollectionResponse>(`/collections/${slug}`, { revalidate: 120 });
  if (!collection) return { title: "Collection" };
  return {
    title: collection.metaTitle ?? `${collection.name} — DAYSHIFT`,
    description: collection.metaDescription ?? collection.description ?? undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const collection = await apiGet<CollectionResponse>(`/collections/${slug}`, { revalidate: 120 });
  if (!collection) notFound();

  const search = new URLSearchParams();
  search.set("collection", slug);
  search.set("pageSize", "24");
  for (const key of ["size", "color", "minPrice", "maxPrice", "inStock", "sort", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value) search.set(key, value);
  }

  const [products, facets] = await Promise.all([
    apiGet<ProductsResponse>(`/products?${search.toString()}`, { revalidate: 30 }),
    apiGet<Facets>(`/products/facets?collection=${slug}`, { revalidate: 120 }),
  ]);

  if (!products || !facets) notFound();

  return (
    <ListingView
      eyebrow={collection.type === "SALE" ? "Final pieces" : "Collection"}
      title={collection.name}
      description={collection.description}
      imageUrl={collection.imageUrl}
      basePath={`/collections/${collection.slug}`}
      products={products.items}
      facets={facets}
      total={products.meta.total}
      page={products.meta.page}
      pageSize={products.meta.pageSize}
      params={{ ...query, collection: slug }}
      breadcrumbs={[{ name: "Collections", href: "/collections" }]}
      emptyMessage="This edit is between drops. Explore new arrivals while you wait."
    />
  );
}
