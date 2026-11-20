import type { Metadata } from "next";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { ListingView, type Facets } from "@/components/listing-view";
import type { ProductCardDto } from "@dayshift/types";
import { SearchBox } from "./search-box";

interface ProductsResponse {
  items: ProductCardDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q : "";
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const rawQ = query.q;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";

  if (!q) {
    return (
      <div className="wrap py-20 md:py-28">
        <p className="overline text-muted">Search</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight md:text-7xl">
          What are you looking for?
        </h1>
        <div className="mt-10 max-w-xl">
          <SearchBox initial="" />
        </div>
        <div className="mt-12 flex flex-wrap gap-2">
          {["Linen shirt", "Oversized tee", "Straight jeans", "Leather tote", "Merino knit", "Sneakers"].map((term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="border border-line px-4 py-2 text-xs uppercase tracking-[0.12em] hover:border-ink"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const search = new URLSearchParams();
  search.set("q", q);
  search.set("pageSize", "24");
  for (const key of ["size", "color", "minPrice", "maxPrice", "inStock", "sort", "page"]) {
    const value = query[key];
    if (typeof value === "string" && value) search.set(key, value);
  }

  const [products, facets] = await Promise.all([
    apiGet<ProductsResponse>(`/products?${search.toString()}`, { revalidate: 0 }),
    apiGet<Facets>(`/products/facets?q=${encodeURIComponent(q)}`, { revalidate: 0 }),
  ]);

  if (!products || !facets) {
    return (
      <div className="wrap py-24 text-center">
        <h1 className="font-display text-4xl">Search is unavailable</h1>
        <p className="mt-3 text-sm text-muted">Please try again in a moment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-line">
        <div className="wrap py-10">
          <p className="overline text-muted">Search results</p>
          <h1 className="mt-2 font-display text-4xl md:text-6xl">“{q}”</h1>
          <div className="mt-6 max-w-xl">
            <SearchBox initial={q} />
          </div>
        </div>
      </div>
      <ListingView
        eyebrow="Search"
        title={`${products.meta.total} ${products.meta.total === 1 ? "result" : "results"}`}
        titleLevel="h2"
        basePath="/search"
        products={products.items}
        facets={facets}
        total={products.meta.total}
        page={products.meta.page}
        pageSize={products.meta.pageSize}
        params={{ ...query, q }}
        emptyMessage={`We couldn't find anything for “${q}”. Try a different term, a category or a SKU.`}
      />
    </div>
  );
}
