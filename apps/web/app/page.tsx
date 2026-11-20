export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import type { ProductCardDto } from "@dayshift/types";

export const metadata: Metadata = {
  title: "DAYSHIFT — Everyday style. Your way.",
  description:
    "Contemporary clothing, footwear, bags and accessories for everyday wear. New season essentials from the DAYSHIFT studio.",
};

interface ContentBlock {
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

interface HomeContent {
  hero: ContentBlock | null;
  announcement: ContentBlock | null;
  editorial: ContentBlock[];
  campaign: ContentBlock | null;
  categories: Array<{ id: string; name: string; slug: string; imageUrl: string | null }>;
  featured: ProductCardDto[];
  newArrivals: ProductCardDto[];
  bestSellers: ProductCardDto[];
}

const CATEGORY_TILES = [
  { name: "Shoes", slug: "shoes", image: "/art/sneaker-white.svg" },
  { name: "Bags", slug: "bags", image: "/art/bag-tan.svg" },
  { name: "Accessories", slug: "accessories", image: "/art/sunglasses-black.svg" },
  { name: "Essentials", slug: "unisex-essentials", image: "/art/tee-optic-white.svg" },
];

export default async function HomePage() {
  const content = await apiGet<HomeContent>("/content/home", { revalidate: 30 });
  if (!content) {
    return (
      <div className="wrap py-32">
        <h1 className="font-display text-5xl">The studio is being prepared.</h1>
        <p className="mt-4 text-muted">Please check back in a moment.</p>
      </div>
    );
  }

  const hero = content.hero;
  const newArrivals = content.newArrivals.slice(0, 4);
  const bestSellers = content.bestSellers.slice(0, 4);
  const featured = content.featured.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="wrap">
          <div className="grid min-h-[calc(100vh-116px)] items-stretch lg:grid-cols-[0.92fr_1.08fr]">
            <div className="flex flex-col justify-center py-14 pr-0 lg:py-24 lg:pr-16">
              <p className="overline text-muted">
                {hero?.subtitle ?? "New season / 2026"}
              </p>
              <h1 className="mt-6 font-display text-[clamp(3.6rem,7.4vw,7.4rem)] leading-[0.9] tracking-[-0.03em]">
                Everyday
                <br />
                style.
                <br />
                <span className="italic">Your way.</span>
              </h1>
              <p className="mt-8 max-w-md text-[15px] leading-relaxed text-ink-soft">
                {hero?.body ??
                  "Considered clothing and accessories for the days that make up a life. Made in small runs, built to be worn."}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href={hero?.ctaUrl ?? "/collections/new-arrivals"} className="btn btn-primary">
                  {hero?.ctaLabel ?? "Shop new arrivals"}
                </Link>
                <Link href="/collections/seasonal-2026" className="btn btn-outline">
                  The seasonal edit
                </Link>
              </div>
              <dl className="mt-14 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
                <div>
                  <dt className="overline !text-[9px] text-muted">Delivery</dt>
                  <dd className="mt-1 text-xs">Free over $150</dd>
                </div>
                <div>
                  <dt className="overline !text-[9px] text-muted">Returns</dt>
                  <dd className="mt-1 text-xs">30 days, free</dd>
                </div>
                <div>
                  <dt className="overline !text-[9px] text-muted">Made</dt>
                  <dd className="mt-1 text-xs">Small runs</dd>
                </div>
              </dl>
            </div>

            <div className="relative min-h-[58vh] overflow-hidden bg-sand lg:min-h-0">
              { }
              <img
                src={hero?.imageUrl ?? "/images/editorial-01.jpg"}
                alt="DAYSHIFT new season studio"
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 md:p-8">
                <span className="bg-paper/92 px-4 py-3 text-[10px] uppercase leading-relaxed tracking-[0.18em] backdrop-blur">
                  The Autumn 2026
                  <br />
                  studio collection
                </span>
                <Link
                  href="/collections/seasonal-2026"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-paper text-ink transition-transform hover:translate-x-1"
                  aria-label="Explore the seasonal edit"
                >
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <div className="flex items-end justify-between gap-8 border-b border-line pb-5">
            <div>
              <p className="overline text-muted">Just landed</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">New arrivals</h2>
            </div>
            <Link href="/collections/new-arrivals" className="link-underline overline hidden sm:inline-flex">
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
          <div className="mt-10 sm:hidden">
            <Link href="/collections/new-arrivals" className="btn btn-outline w-full">
              View all new arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* Editorial split */}
      <section className="border-y border-line bg-paper-deep">
        <div className="wrap py-16 md:py-24">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {content.editorial.slice(0, 2).map((block, index) => (
              <Link
                key={block.key}
                href={block.ctaUrl ?? (index === 0 ? "/c/women" : "/c/men")}
                className="group relative block aspect-[4/5] overflow-hidden bg-sand"
              >
                { }
                <img
                  src={block.imageUrl ?? (index === 0 ? "/images/editorial-03.jpg" : "/images/editorial-02.jpg")}
                  alt={block.title ?? (index === 0 ? "Women's collection" : "Men's collection")}
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.025]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-paper md:p-10">
                  <p className="overline !text-[10px] text-paper/70">{block.subtitle ?? (index === 0 ? "Women" : "Men")}</p>
                  <h2 className="mt-2 max-w-sm font-display text-3xl leading-tight md:text-4xl">
                    {block.title ?? (index === 0 ? "The soft tailoring edit" : "Built for the everyday")}
                  </h2>
                  <p className="mt-3 hidden max-w-xs text-sm leading-relaxed text-paper/80 sm:block">
                    {block.body}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
                    {block.ctaLabel ?? "Explore"} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <div className="flex items-end justify-between gap-8 border-b border-line pb-5">
            <div>
              <p className="overline text-muted">The ones you come back for</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">Best sellers</h2>
            </div>
            <Link href="/collections/best-sellers" className="link-underline overline hidden sm:inline-flex">
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Campaign */}
      <section className="border-y border-line">
        <div className="grid lg:grid-cols-2">
          <div className="order-2 flex flex-col justify-center bg-ink px-6 py-20 text-paper md:px-16 lg:order-1 lg:py-32">
            <p className="overline text-paper/55">Autumn 2026</p>
            <h2 className="mt-4 max-w-lg font-display text-4xl leading-[1.02] md:text-6xl">
              {content.campaign?.title ?? "The Seasonal Edit"}
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-paper/70">
              {content.campaign?.body ??
                "Layer up in brushed cotton, fine merino and softened denim. A considered edit for the season ahead."}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={content.campaign?.ctaUrl ?? "/collections/seasonal-2026"}
                className="btn border-paper bg-paper text-ink hover:bg-transparent hover:text-paper"
              >
                {content.campaign?.ctaLabel ?? "Explore the edit"}
              </Link>
              <Link href="/collections/new-arrivals" className="btn border-paper/40 text-paper hover:border-paper">
                New arrivals
              </Link>
            </div>
          </div>
          <div className="order-1 relative min-h-[52vh] bg-sand lg:order-2 lg:min-h-[70vh]">
            { }
            <img
              src={content.campaign?.imageUrl ?? "/art/dress-stone.svg"}
              alt="The seasonal edit"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Featured / categories */}
      <section className="py-20 md:py-28">
        <div className="wrap">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="overline text-muted">Shop by category</p>
              <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                The pieces that
                <br />
                finish the look.
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">
                Footwear, bags and the small things that make a wardrobe feel like your own.
                Considered materials, honest construction.
              </p>
              <Link href="/c/accessories" className="btn btn-outline mt-8">
                Shop accessories
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {CATEGORY_TILES.map((tile) => (
                <Link
                  key={tile.slug}
                  href={`/c/${tile.slug}`}
                  className="group relative aspect-square overflow-hidden bg-sand"
                >
                  { }
                  <img
                    src={tile.image}
                    alt={tile.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <span className="absolute bottom-4 left-4 bg-paper/92 px-3 py-2 text-[11px] uppercase tracking-[0.16em]">
                    {tile.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="border-t border-line py-20 md:py-24">
          <div className="wrap">
            <div className="flex items-end justify-between gap-8">
              <div>
                <p className="overline text-muted">From the studio</p>
                <h2 className="mt-2 font-display text-4xl md:text-5xl">The essentials</h2>
              </div>
              <Link href="/collections/essentials" className="link-underline overline hidden sm:inline-flex">
                Shop essentials
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service promises */}
      <section className="border-y border-line bg-paper-deep">
        <div className="wrap grid gap-8 py-12 md:grid-cols-3">
          {[
            {
              title: "Complimentary delivery",
              body: "Free standard delivery on orders over $150. Express available at checkout.",
            },
            {
              title: "30-day returns",
              body: "Changed your mind? Return unworn pieces within 30 days, free of charge.",
            },
            {
              title: "Made in small runs",
              body: "We produce in limited quantities, with suppliers we know by name.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-ink/20 pt-5">
              <h3 className="font-display text-xl">{item.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing statement */}
      <section className="py-24 md:py-36">
        <div className="wrap text-center">
          <p className="overline text-muted">The DAYSHIFT note</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-[clamp(2.8rem,6vw,6rem)] leading-[0.98] tracking-[-0.02em]">
            Built for the days that
            <br />
            make up a life.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted">
            A wardrobe should work as hard as you do. Our pieces are designed to be worn
            often, cared for properly and kept for years.
          </p>
          <Link href="/about" className="btn btn-outline mt-10">
            Read our story
          </Link>
        </div>
      </section>
    </>
  );
}
