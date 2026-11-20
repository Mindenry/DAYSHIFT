import Link from "next/link";
import type { ProductCardDto } from "@dayshift/types";
import { serializeJsonLd } from "@dayshift/config";
import { ProductCard } from "./product-card";
import { ListingFilters } from "./listing-filters";
import { getI18n } from "@/lib/i18n";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export interface Facets {
  sizes: Array<{ name: string; count: number }>;
  colors: Array<{ name: string; hex: string | null; count: number }>;
  price: { min: number; max: number };
}

interface Props {
  eyebrow: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  basePath: string;
  products: ProductCardDto[];
  facets: Facets;
  total: number;
  page: number;
  pageSize: number;
  params: Record<string, string | string[] | undefined>;
  breadcrumbs?: Array<{ name: string; href: string }>;
  emptyMessage?: string;
  titleLevel?: "h1" | "h2";
}

function buildQuery(params: Record<string, string | string[] | undefined>, overrides: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page") continue;
    if (Array.isArray(value)) value.forEach((v) => v && search.append(key, v));
    else if (value) search.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) search.delete(key);
    else search.set(key, value);
  }
  return search.toString();
}

export async function ListingView({
  eyebrow,
  title,
  description,
  imageUrl,
  basePath,
  products,
  facets,
  total,
  page,
  pageSize,
  params,
  breadcrumbs,
  emptyMessage,
  titleLevel = "h1",
}: Props) {
  const { t } = await getI18n();
  const SORT_OPTIONS = [
    { value: "newest", label: t("Newest") },
    { value: "popular", label: t("Most loved") },
    { value: "price-asc", label: t("Price: low to high") },
    { value: "price-desc", label: t("Price: high to low") },
    { value: "rating", label: t("Top rated") },
  ];
  const activeSize = typeof params.size === "string" ? params.size : "";
  const activeColor = typeof params.color === "string" ? params.color : "";
  const activeSort = typeof params.sort === "string" ? params.sort : "newest";
  const activeMin = typeof params.minPrice === "string" ? params.minPrice : "";
  const activeMax = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const activeStock = params.inStock === "true";
  const hasFilters = !!(activeSize || activeColor || activeMin || activeMax || activeStock || params.q);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const chips = [
    activeSize && { label: `${t("Size")} ${activeSize}`, key: "size" },
    activeColor && { label: activeColor, key: "color" },
    activeMin && { label: `${t("From")} ฿${activeMin}`, key: "minPrice" },
    activeMax && { label: `${t("To")} ฿${activeMax}`, key: "maxPrice" },
    activeStock && { label: t("In stock"), key: "inStock" },
    typeof params.q === "string" && params.q && { label: `“${params.q}”`, key: "q" },
  ].filter(Boolean) as Array<{ label: string; key: string }>;

  const itemListLd =
    products.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          numberOfItems: products.length,
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE}/products/${product.slug}`,
            name: product.name,
          })),
        }
      : null;
  const breadcrumbLd =
    breadcrumbs && breadcrumbs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
            ...breadcrumbs.map((crumb, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: crumb.name,
              item: `${SITE}${crumb.href}`,
            })),
            { "@type": "ListItem", position: breadcrumbs.length + 2, name: title },
          ],
        }
      : null;

  return (
    <>
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListLd) }} />
      )}
      {breadcrumbLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      )}
      <div>
      <div className="border-b border-line">
        <div className="wrap py-10 md:py-14">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label={t("Breadcrumb")} className="mb-6 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
              <Link href="/" className="link-underline">{t("Home")}</Link>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.href} className="flex items-center gap-2">
                  <span aria-hidden>/</span>
                  <Link href={crumb.href} className="link-underline">{crumb.name}</Link>
                </span>
              ))}
            </nav>
          )}
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="overline text-muted">{eyebrow}</p>
              {titleLevel === "h1" ? (
                <h1 className="mt-3 font-display text-5xl leading-[0.95] md:text-7xl">{title}</h1>
              ) : (
                <h2 className="mt-3 font-display text-4xl leading-[0.95] md:text-5xl">{title}</h2>
              )}
              {description && <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">{description}</p>}
            </div>
            {imageUrl && (
              <div className="hidden h-32 w-56 overflow-hidden bg-sand lg:block">
                { }
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="wrap py-8 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          <aside>
            <ListingFilters
              facets={facets}
              basePath={basePath}
              params={params}
              activeSort={activeSort}
              sortOptions={SORT_OPTIONS}
            />
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <p className="text-sm text-muted">
                {total} {total === 1 ? t("piece") : t("pieces")}
              </p>
              <div className="hidden items-center gap-3 sm:flex">
                <label htmlFor="sort-top" className="overline text-muted">{t("Sort")}</label>
                <form method="get" action={basePath} className="contents">
                  {Object.entries(params).map(([key, value]) =>
                    key !== "sort" && key !== "page" && typeof value === "string" ? (
                      <input key={key} type="hidden" name={key} value={value} />
                    ) : null,
                  )}
                  <select
                    id="sort-top"
                    name="sort"
                    defaultValue={activeSort}
                    className="border-0 border-b border-line bg-transparent py-1 text-xs uppercase tracking-[0.12em] focus:border-ink focus:outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button type="submit" className="overline underline underline-offset-4">{t("Apply")}</button>
                </form>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 py-4">
                {chips.map((chip) => (
                  <Link
                    key={chip.key}
                    href={`${basePath}?${buildQuery(params, { [chip.key]: undefined, page: undefined })}`}
                    className="inline-flex items-center gap-2 border border-line bg-paper px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] hover:border-ink"
                  >
                    {chip.label} <span aria-hidden>×</span>
                  </Link>
                ))}
                <Link href={basePath} className="px-2 text-[11px] uppercase tracking-[0.1em] underline">
                  {t("Clear all")}
                </Link>
              </div>
            )}

            {products.length === 0 ? (
              <div className="py-24 text-center">
                <h2 className="font-display text-3xl">{t("Nothing here yet.")}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                  {emptyMessage ?? t("Try removing a filter or exploring another part of the collection.")}
                </p>
                <Link href={basePath} className="btn btn-outline mt-8">{t("Clear filters")}</Link>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 min-[360px]:gap-x-4 md:gap-x-6 md:gap-y-10 xl:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 3} revealDelay={index * 45} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav aria-label={t("Pagination")} className="mt-16 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`${basePath}?${buildQuery(params, { page: String(page - 1) })}`}
                    className="border border-line px-4 py-2 text-xs uppercase tracking-[0.12em] hover:border-ink"
                  >
                    {t("Previous")}
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .map((n, index, arr) => (
                    <span key={n} className="flex items-center gap-2">
                      {index > 0 && arr[index - 1] !== n - 1 && <span className="px-1 text-muted">…</span>}
                      <Link
                        href={`${basePath}?${buildQuery(params, { page: String(n) })}`}
                        aria-current={n === page ? "page" : undefined}
                        className={`flex h-10 w-10 items-center justify-center border text-xs ${
                          n === page ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                        }`}
                      >
                        {n}
                      </Link>
                    </span>
                  ))}
                {page < totalPages && (
                  <Link
                    href={`${basePath}?${buildQuery(params, { page: String(page + 1) })}`}
                    className="border border-line px-4 py-2 text-xs uppercase tracking-[0.12em] hover:border-ink"
                  >
                    {t("Next")}
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
