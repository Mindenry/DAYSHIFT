import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";

export const dynamic = "force-dynamic";

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

interface SitemapData {
  products: Array<{ slug: string; updatedAt: string }>;
  categories: Array<{ slug: string; updatedAt: string }>;
  collections: Array<{ slug: string; updatedAt: string }>;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: SitemapData | null;
  try {
    data = await apiGet<SitemapData>("/content/sitemap", { revalidate: 3600 });
  } catch {
    data = null;
  }
  const staticRoutes = [
    "",
    "/collections",
    "/collections/new-arrivals",
    "/collections/best-sellers",
    "/collections/essentials",
    "/collections/seasonal-2026",
    "/collections/limited-drops",
    "/collections/sale",
    "/about",
    "/about/materials",
    "/about/stores",
    "/about/careers",
    "/support",
    "/help/delivery-returns",
    "/help/size-guide",
    "/help/care",
    "/legal/privacy",
    "/legal/terms",
    "/legal/cookies",
    "/legal/accessibility",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: path.includes("collections") ? ("weekly" as const) : ("monthly" as const),
    priority: path === "" ? 1 : 0.7,
  }));

  if (!data) return staticRoutes;

  return [
    ...staticRoutes,
    ...data.products.map((product) => ({
      url: `${BASE}/products/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...data.categories.map((category) => ({
      url: `${BASE}/c/${category.slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...data.collections.map((collection) => ({
      url: `${BASE}/collections/${collection.slug}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
