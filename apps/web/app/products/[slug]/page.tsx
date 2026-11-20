export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { ProductDetailDto } from "@dayshift/types";
import { ProductExperience } from "@/components/product-experience";
import { ProductCard } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import { HelpfulButton } from "@/components/helpful-button";
import { RecentlyViewed } from "@/components/recently-viewed";
import { serializeJsonLd } from "@dayshift/config";

type Product = ProductDetailDto & { reviewTotal?: number };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await apiGet<Product>(`/products/${slug}`, { revalidate: 60 });
  if (!product) return { title: "Product" };
  return {
    title: product.metaTitle ?? `${product.name} — DAYSHIFT`,
    description: product.metaDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.primaryImage ? [{ url: product.primaryImage }] : undefined,
      type: "website",
    },
  };
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} aria-hidden className={star <= Math.round(rating) ? "text-ink" : "text-line"}>★</span>
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, session] = await Promise.all([
    apiGet<Product>(`/products/${slug}`, { revalidate: 30 }),
    getSession(),
  ]);
  if (!product) notFound();

  const reviews = product.reviews ?? [];
  const distribution = product.rating.distribution ?? {};
  const totalReviews = product.rating.count || 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.images.map((image) => image.url),
    brand: { "@type": "Brand", name: product.brand?.name ?? "DAYSHIFT" },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `/products/${product.slug}`,
      seller: { "@type": "Organization", name: "DAYSHIFT" },
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "/" },
      ...(product.categories[0]
        ? [{ "@type": "ListItem", position: 2, name: product.categories[0].name, item: `/c/${product.categories[0].slug}` }]
        : []),
      { "@type": "ListItem", position: product.categories[0] ? 3 : 2, name: product.name, item: `/products/${product.slug}` },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />

      <ProductExperience product={product} />

      {/* Reviews */}
      <section id="reviews" className="mt-24 border-t border-line py-16 md:py-24">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="overline text-muted">Reviews</p>
              <h2 className="mt-2 font-display text-4xl">Worn & reviewed</h2>
              {product.rating.count > 0 ? (
                <>
                  <div className="mt-6 flex items-end gap-4">
                    <span className="font-display text-6xl">{product.rating.average.toFixed(1)}</span>
                    <div className="pb-2">
                      <Stars rating={product.rating.average} className="text-lg" />
                      <p className="mt-1 text-xs text-muted">{product.rating.count} verified reviews</p>
                    </div>
                  </div>
                  <div className="mt-6 max-w-sm space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = distribution[String(star)] ?? 0;
                      const percent = Math.round((count / totalReviews) * 100);
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-3 text-muted">{star}</span>
                          <div className="h-1.5 flex-1 bg-line">
                            <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-6 text-right text-muted">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p>
              )}
              <div className="mt-8">
                {session ? (
                  <ReviewForm productId={product.id} productName={product.name} />
                ) : (
                  <div className="border border-line p-5">
                    <p className="text-sm text-muted">Purchased this piece? Sign in to leave a review.</p>
                    <Link href={`/login?next=/products/${product.slug}`} className="btn btn-outline mt-4">Sign in</Link>
                  </div>
                )}
              </div>
            </div>
            <div>
              {reviews.length === 0 ? (
                <div className="flex h-full min-h-40 items-center justify-center border border-dashed border-line p-8 text-center text-sm text-muted">
                  Reviews from verified customers will appear here.
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-6 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Stars rating={review.rating} />
                        {review.isVerifiedPurchase && (
                          <span className="border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                            Verified purchase
                          </span>
                        )}
                        <span className="text-xs text-muted">
                          {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {review.title && <h3 className="mt-3 font-display text-xl">{review.title}</h3>}
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                        <span>{review.authorName}</span>
                        <HelpfulButton reviewId={review.id} initialCount={review.helpfulCount} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {product.related.length > 0 && (
        <section className="border-t border-line py-16 md:py-24">
          <div className="wrap">
            <div className="flex items-end justify-between">
              <div>
                <p className="overline text-muted">Complete the look</p>
                <h2 className="mt-2 font-display text-4xl">Wear it with</h2>
              </div>
              <Link href={`/c/${product.categories[0]?.slug ?? "women"}`} className="overline link-underline hidden sm:inline-flex">
                More from {product.categories[0]?.name ?? "the collection"}
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {product.related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <RecentlyViewed
        current={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.primaryImage,
        }}
      />
    </div>
  );
}
