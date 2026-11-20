export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { apiGet } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { ParallaxLayer } from "@/components/parallax-layer";
import { serializeJsonLd } from "@dayshift/config";
import type { ProductCardDto } from "@dayshift/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "DAYSHIFT — Considered clothing for everyday life",
  description:
    "Shop contemporary clothing, shoes, bags and accessories for women and men. Small-run pieces, free delivery over $150 and 30-day returns.",
  alternates: { canonical: "/" },
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

const FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery arrives in 3–5 business days. It is free on orders over $150, otherwise $7.95. Express delivery is available at checkout.",
  },
  {
    question: "What is the returns policy?",
    answer:
      "Return unworn pieces with tags attached within 30 days of delivery, free of charge. Final-sale items are not returnable. Exchanges are available for another size or colour.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Every product page includes a size guide, measurements and fit notes. If you are between sizes, take the larger size for a relaxed fit.",
  },
  {
    question: "Can I track my order?",
    answer:
      "Yes. Use the order tracking page with your order number and the email address used at checkout to see fulfilment and tracking events.",
  },
  {
    question: "Is checkout secure?",
    answer:
      "This is a demonstration storefront with a simulated sandbox payment provider. No real card data is accepted or stored, and no money is processed.",
  },
  {
    question: "Where is DAYSHIFT made?",
    answer:
      "Pieces are produced in small runs with suppliers the studio knows by name. Materials and care instructions are listed on every product page.",
  },
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
  const categoryTiles = CATEGORY_TILES;

  const itemListLd = newArrivals.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "New arrivals",
        itemListElement: newArrivals.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE}/products/${product.slug}`,
          name: product.name,
        })),
      }
    : null;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };

  return (
    <>
      {itemListLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />

      {/* Hero: full-bleed image on phones, split editorial panel from lg. */}
      <section className="relative isolate overflow-hidden border-b border-line bg-ink lg:bg-paper">
        <ParallaxLayer className="absolute inset-0 lg:hidden">
          <img
            src={hero?.imageUrl ?? "/images/editorial-01.jpg"}
            alt=""
            className="h-full w-full animate-hero-image object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10" />
        </ParallaxLayer>

        <div className="wrap relative">
          <div className="grid min-h-[88svh] items-stretch lg:min-h-[calc(100svh-116px)] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10 flex animate-fade-up flex-col justify-end pb-12 pt-28 text-paper lg:justify-center lg:py-24 lg:pr-10 lg:text-ink">
              <p className="overline text-paper/80 lg:text-muted">
                {hero?.subtitle ?? "New season / 2026"}
              </p>
              <h1 className="mt-5 font-display text-[clamp(3.1rem,13vw,4.8rem)] leading-[0.92] tracking-[-0.03em] text-paper lg:text-[clamp(4.2rem,6.4vw,7rem)] lg:text-ink">
                <span className="hero-line" style={{ "--i": "80ms" } as React.CSSProperties}>
                  Everyday style.
                </span>
                <span className="hero-line italic" style={{ "--i": "220ms" } as React.CSSProperties}>
                  Your way.
                </span>
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-paper/85 lg:mt-8 lg:text-ink-soft">
                {hero?.body ??
                  "Considered clothing and accessories for the days that make up a life. Made in small runs, built to be worn."}
              </p>
              <div className="mt-8 flex flex-col gap-2.5 sm:flex-row lg:mt-10 lg:gap-3">
                <Link
                  href={hero?.ctaUrl ?? "/collections/new-arrivals"}
                  className="btn border-paper bg-paper text-ink hover:bg-transparent hover:text-paper lg:border-ink lg:bg-ink lg:text-paper lg:hover:bg-paper lg:hover:text-ink"
                >
                  {hero?.ctaLabel ?? "Shop new arrivals"}
                </Link>
                <Link
                  href="/collections/seasonal-2026"
                  className="btn border-paper/50 text-paper hover:border-paper lg:border-ink lg:text-ink lg:hover:bg-ink lg:hover:text-paper"
                >
                  The seasonal edit
                </Link>
              </div>
              <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-paper/25 pt-5 lg:mt-12 lg:border-line lg:pt-6">
                <div>
                  <dt className="overline !text-[9px] text-paper/65 lg:text-muted">Delivery</dt>
                  <dd className="mt-1 text-xs text-paper/90 lg:text-ink">Free over $150</dd>
                </div>
                <div>
                  <dt className="overline !text-[9px] text-paper/65 lg:text-muted">Returns</dt>
                  <dd className="mt-1 text-xs text-paper/90 lg:text-ink">30 days, free</dd>
                </div>
                <div>
                  <dt className="overline !text-[9px] text-paper/65 lg:text-muted">Made</dt>
                  <dd className="mt-1 text-xs text-paper/90 lg:text-ink">Small runs</dd>
                </div>
              </dl>
            </div>

            <div className="relative hidden overflow-hidden lg:block">
              <ParallaxLayer className="absolute inset-0">
                <img
                  src={hero?.imageUrl ?? "/images/editorial-01.jpg"}
                  alt="DAYSHIFT autumn studio collection"
                  className="h-full w-full animate-hero-image object-cover"
                  fetchPriority="high"
                  decoding="async"
                />
              </ParallaxLayer>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 xl:p-8">
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

      {/* Service strip */}
      <section aria-label="Service promises" className="border-b border-line bg-paper-deep">
        <div className="wrap grid grid-cols-2 gap-x-4 gap-y-5 py-6 sm:grid-cols-4 md:py-7">
          {[
            { icon: Truck, title: "Free delivery", body: "Orders over $150" },
            { icon: RotateCcw, title: "30-day returns", body: "Free and easy" },
            { icon: ShieldCheck, title: "Secure checkout", body: "Sandbox payment" },
            { icon: Sparkles, title: "Small runs", body: "Made to be worn" },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <item.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em]">{item.title}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section aria-labelledby="new-arrivals" className="py-16 md:py-24">
        <div className="wrap">
          <div className="flex items-end justify-between gap-8 border-b border-line pb-5" data-reveal>
            <div>
              <p className="overline text-muted">Just landed</p>
              <h2 id="new-arrivals" className="mt-2 font-display text-3xl md:text-5xl">New arrivals</h2>
            </div>
            <Link href="/collections/new-arrivals" className="link-underline overline hidden shrink-0 sm:inline-flex">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 min-[360px]:gap-x-4 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
            {newArrivals.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} revealDelay={index * 60} />
            ))}
          </div>
          <div className="mt-8 sm:hidden">
            <Link href="/collections/new-arrivals" className="btn btn-outline w-full">
              View all new arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section aria-labelledby="shop-by-category" className="border-y border-line bg-paper-deep py-16 md:py-24">
        <div className="wrap">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start" data-reveal>
              <p className="overline text-muted">Shop by category</p>
              <h2 id="shop-by-category" className="mt-3 font-display text-3xl leading-tight md:text-5xl">
                The pieces that
                <br className="hidden md:block" /> finish the look.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
                Footwear, bags and the small things that make a wardrobe feel like your own.
                Considered materials, honest construction.
              </p>
              <Link href="/c/accessories" className="btn btn-outline mt-7">
                Shop accessories
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-5">
              {categoryTiles.map((tile, index) => (
                <Link
                  key={tile.slug}
                  href={`/c/${tile.slug}`}
                  data-reveal
                  style={{ "--reveal-delay": `${index * 70}ms` } as React.CSSProperties}
                  className="group relative aspect-square overflow-hidden bg-sand transition-transform duration-200 active:scale-[0.99]"
                >
                  <img
                    src={tile.image}
                    alt={tile.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute bottom-3 left-3 bg-paper/92 px-3 py-2 text-[10px] uppercase tracking-[0.16em] backdrop-blur md:bottom-4 md:left-4">
                    {tile.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Editorial split */}
      <section aria-labelledby="editorial" className="py-16 md:py-24">
        <div className="wrap">
          <h2 id="editorial" className="sr-only">Editorial collections</h2>
          <div className="grid gap-3 md:grid-cols-2 md:gap-5">
            {content.editorial.slice(0, 2).map((block, index) => (
              <Link
                key={block.key}
                href={block.ctaUrl ?? (index === 0 ? "/c/women" : "/c/men")}
                data-reveal
                style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
                className="group relative block aspect-[4/5] overflow-hidden bg-sand transition-transform duration-200 active:scale-[0.995]"
              >
                <img
                  src={block.imageUrl ?? (index === 0 ? "/images/editorial-03.jpg" : "/images/editorial-02.jpg")}
                  alt={block.title ?? (index === 0 ? "Women's collection" : "Men's collection")}
                  className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.025]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-paper md:p-10">
                  <p className="overline !text-[10px] text-paper/70">{block.subtitle ?? (index === 0 ? "Women" : "Men")}</p>
                  <h3 className="mt-2 max-w-sm font-display text-2xl leading-tight md:text-4xl">
                    {block.title ?? (index === 0 ? "The soft tailoring edit" : "Built for the everyday")}
                  </h3>
                  <p className="mt-2 hidden max-w-xs text-sm leading-relaxed text-paper/80 sm:block">
                    {block.body}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] md:mt-6">
                    {block.ctaLabel ?? "Explore"} <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Campaign */}
      <section aria-labelledby="seasonal-edit" className="border-y border-line">
        <div className="grid lg:grid-cols-2">
          <div className="order-2 flex flex-col justify-center bg-ink px-5 py-16 text-paper md:px-14 lg:order-1 lg:py-28" data-reveal>
            <p className="overline text-paper/60">Autumn 2026</p>
            <h2 id="seasonal-edit" className="mt-4 max-w-lg font-display text-4xl leading-[1.02] md:text-6xl">
              {content.campaign?.title ?? "The Seasonal Edit"}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-paper/70">
              {content.campaign?.body ??
                "Layer up in brushed cotton, fine merino and softened denim. A considered edit for the season ahead."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
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
          <div className="relative order-1 min-h-[46vh] bg-sand lg:order-2 lg:min-h-[70vh]" data-reveal>
            <img
              src={content.campaign?.imageUrl ?? "/art/dress-stone.svg"}
              alt="The seasonal edit"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section aria-labelledby="best-sellers" className="py-16 md:py-24">
        <div className="wrap">
          <div className="flex items-end justify-between gap-8 border-b border-line pb-5" data-reveal>
            <div>
              <p className="overline text-muted">The ones you come back for</p>
              <h2 id="best-sellers" className="mt-2 font-display text-3xl md:text-5xl">Best sellers</h2>
            </div>
            <Link href="/collections/best-sellers" className="link-underline overline hidden shrink-0 sm:inline-flex">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 min-[360px]:gap-x-4 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <ProductCard key={product.id} product={product} revealDelay={index * 60} />
            ))}
          </div>
          <div className="mt-8 sm:hidden">
            <Link href="/collections/best-sellers" className="btn btn-outline w-full">
              View all best sellers
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ: concise answers for customers and answer engines. */}
      <section aria-labelledby="faq" className="border-y border-line bg-paper-deep py-16 md:py-24">
        <div className="wrap grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div data-reveal>
            <p className="overline text-muted">Before you order</p>
            <h2 id="faq" className="mt-3 font-display text-3xl md:text-4xl">Questions, answered.</h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Delivery, returns and sizing in plain language. Still unsure? Customer care replies within one working day.
            </p>
            <Link href="/support" className="link-underline overline mt-6 inline-flex">
              Contact customer care
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
            {FAQS.map((entry) => (
              <details key={entry.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-left">
                  <span className="font-display text-lg leading-snug md:text-xl">{entry.question}</span>
                  <span aria-hidden className="mt-1 text-xl leading-none text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{entry.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className="py-20 md:py-32">
        <div className="wrap text-center" data-reveal>
          <p className="overline text-muted">The DAYSHIFT note</p>
          <h2 className="mx-auto mt-5 max-w-4xl font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.98] tracking-[-0.02em]">
            Built for the days that
            <br />
            make up a life.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted">
            A wardrobe should work as hard as you do. Pieces designed to be worn often,
            cared for properly and kept for years.
          </p>
          <Link href="/about" className="btn btn-outline mt-8">
            Read our story
          </Link>
        </div>
      </section>
    </>
  );
}
