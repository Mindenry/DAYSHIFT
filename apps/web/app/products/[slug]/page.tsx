export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { stripBrandSuffix } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import type { ProductDetailDto } from "@dayshift/types";
import { ProductExperience } from "@/components/product-experience";
import { ProductCard } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import { HelpfulButton } from "@/components/helpful-button";
import { RecentlyViewed } from "@/components/recently-viewed";
import { serializeJsonLd } from "@dayshift/config";

type Product = ProductDetailDto & { reviewTotal?: number };

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await apiGet<Product>(`/products/${slug}`, { revalidate: 60 });
  if (!product) return { title: "Product" };
  const ogImage =
    product.primaryImage && !product.primaryImage.toLowerCase().endsWith(".svg")
      ? product.primaryImage
      : "/og-default.png";
  return {
    title: stripBrandSuffix(product.metaTitle, product.name),
    description: product.metaDescription ?? product.shortDescription ?? undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: [{ url: ogImage, alt: product.name }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: [ogImage],
    },
  };
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${rating} / 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} aria-hidden className={star <= Math.round(rating) ? "text-ink" : "text-line"}>★</span>
      ))}
    </span>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t, locale } = await getI18n();
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
    url: `${SITE}/products/${product.slug}`,
    category: product.categories[0]?.name,
    brand: { "@type": "Brand", name: product.brand?.name ?? "DAYSHIFT" },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price,
      url: `${SITE}/products/${product.slug}`,
      priceValidUntil: new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
      itemCondition: "https://schema.org/NewCondition",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "DAYSHIFT", url: SITE },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "50", currency: "THB" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 5, unitCode: "DAY" },
        },
      },
    },
    ...(product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(reviews.length
      ? {
          review: reviews.slice(0, 5).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.authorName },
            datePublished: review.createdAt,
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
            ...(review.title ? { name: review.title } : {}),
            reviewBody: review.body,
          })),
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      ...(product.categories[0]
        ? [{
            "@type": "ListItem",
            position: 2,
            name: product.categories[0].name,
            item: `${SITE}/c/${product.categories[0].slug}`,
          }]
        : []),
      { "@type": "ListItem", position: product.categories[0] ? 3 : 2, name: product.name, item: `${SITE}/products/${product.slug}` },
    ],
  };

  return (
    <div className="pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />

      <ProductExperience product={product} />

      {/* Reviews */}
      <section id="reviews" className="mt-24 border-t border-line py-16 md:py-24">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="overline text-muted">{t("Reviews")}</p>
              <h2 className="mt-2 font-display text-4xl">{t("Worn & reviewed")}</h2>
              {product.rating.count > 0 ? (
                <>
                  <div className="mt-6 flex items-end gap-4">
                    <span className="font-display text-6xl">{product.rating.average.toFixed(1)}</span>
                    <div className="pb-2">
                      <Stars rating={product.rating.average} className="text-lg" />
                      <p className="mt-1 text-xs text-muted">{product.rating.count} {t("verified reviews")}</p>
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
                <p className="mt-4 text-sm text-muted">{t("No reviews yet. Be the first to share your thoughts.")}</p>
              )}
              <div className="mt-8">
                {session ? (
                  <ReviewForm productId={product.id} productName={product.name} />
                ) : (
                  <div className="border border-line p-5">
                    <p className="text-sm text-muted">{t("Purchased this piece? Sign in to leave a review.")}</p>
                    <Link href={`/login?next=/products/${product.slug}`} className="btn btn-outline mt-4">{t("Sign in")}</Link>
                  </div>
                )}
              </div>
            </div>
            <div>
              {reviews.length === 0 ? (
                <div className="flex h-full min-h-40 items-center justify-center border border-dashed border-line p-8 text-center text-sm text-muted">
                  {t("Reviews from verified customers will appear here.")}
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {reviews.map((review) => (
                    <li key={review.id} className="py-6 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Stars rating={review.rating} />
                        {review.isVerifiedPurchase && (
                          <span className="border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">
                            {t("Verified purchase")}
                          </span>
                        )}
                        <span className="text-xs text-muted">
                          {new Date(review.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { month: "short", year: "numeric" })}
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
                <p className="overline text-muted">{t("Complete the look")}</p>
                <h2 className="mt-2 font-display text-4xl">{t("Wear it with")}</h2>
              </div>
              <Link href={`/c/${product.categories[0]?.slug ?? "women"}`} className="overline link-underline hidden sm:inline-flex">
                {t("More from {name}", { name: product.categories[0]?.name ?? t("the collection") })}
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
