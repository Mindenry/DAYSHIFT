import { Prisma } from "@dayshift/db";

type DecimalLike = { toString(): string };

export const productInclude = {
  brand: true,
  images: { orderBy: { position: "asc" as const } },
  categories: { include: { category: true } },
  collections: { include: { collection: true } },
  variants: {
    where: { isActive: true },
    orderBy: { position: "asc" as const },
    include: {
      inventory: { select: { onHand: true, reserved: true, damaged: true } },
    },
  },
  sizeGuide: true,
  reviews: { where: { status: "APPROVED" as const }, select: { rating: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL",
  "24", "25", "26", "27", "28", "29", "30", "31",
  "28R", "30R", "32R", "34R", "36R", "38R",
  "40", "41", "42", "43", "44", "45", "46",
  "S/M", "L/XL", "One Size",
];

function available(variant: { inventory: { onHand: number; reserved: number; damaged: number }[] }) {
  return variant.inventory.reduce(
    (sum, item) => sum + Math.max(0, item.onHand - item.reserved - item.damaged),
    0,
  );
}

export function priceOf(product: { price: DecimalLike; compareAtPrice: DecimalLike | null }, variants: { priceOverride: DecimalLike | null }[]) {
  const overrides = variants
    .map((v) => (v.priceOverride ? Number(v.priceOverride.toString()) : null))
    .filter((v): v is number => v !== null);
  const base = Number(product.price.toString());
  const price = overrides.length ? Math.min(base, ...overrides) : base;
  return { price, compareAt: product.compareAtPrice ? Number(product.compareAtPrice.toString()) : null };
}

export function toProductCard(product: ProductWithRelations) {
  const active = product.variants;
  const inStock = active.some((v) => available(v) > 0);
  const colors = new Map<string, { name: string; hex: string | null }>();
  active.forEach((v) => {
    if (v.color && !colors.has(v.color)) colors.set(v.color, { name: v.color, hex: v.colorHex });
  });
  const sizes = Array.from(new Set(active.map((v) => v.size).filter((s): s is string => !!s)));
  sizes.sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  const { price, compareAt } = priceOf(product, active);
  const ratings = product.reviews;
  const average = ratings.length
    ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10
    : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: price.toFixed(2),
    compareAtPrice: compareAt?.toFixed(2) ?? null,
    currency: product.currency,
    primaryImage: product.images[0]?.url ?? active[0]?.imageUrl ?? null,
    secondaryImage: product.images[1]?.url ?? active[1]?.imageUrl ?? null,
    brand: product.brand ? { id: product.brand.id, name: product.brand.name, slug: product.brand.slug } : null,
    colors: Array.from(colors.values()),
    sizes,
    inStock,
    isNew: product.publishedAt ? Date.now() - product.publishedAt.getTime() < 45 * 86_400_000 : false,
    rating: { average, count: ratings.length },
    isFeatured: product.isFeatured,
  };
}

export function toProductDetail(
  product: ProductWithRelations,
  options: {
    reviews: Array<{
      id: string;
      rating: number;
      title: string | null;
      body: string;
      isVerifiedPurchase: boolean;
      helpfulCount: number;
      createdAt: Date;
      user: { firstName: string; lastName: string };
    }>;
    related: ProductWithRelations[];
    reviewStats?: { distribution: Record<string, number> };
  },
) {
  const card = toProductCard(product);
  return {
    ...card,
    sku: product.sku,
    shortDescription: product.shortDescription,
    description: product.description,
    material: product.material,
    careInstructions: product.careInstructions,
    fitNotes: product.fitNotes,
    features: product.features,
    tags: product.tags,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    publishedAt: product.publishedAt,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt,
      color: image.color,
      position: image.position,
    })),
    variants: product.variants.map((variant) => {
      const { price: variantPrice } = priceOf(
        { price: product.price, compareAtPrice: null },
        [variant],
      );
      return {
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex,
        price: variantPrice.toFixed(2),
        compareAtPrice: card.compareAtPrice,
        availableStock: available(variant),
        inStock: available(variant) > 0,
        imageUrl: variant.imageUrl,
        isActive: variant.isActive,
      };
    }),
    categories: product.categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
      slug: pc.category.slug,
    })),
    collections: product.collections.map((pc) => ({
      id: pc.collection.id,
      name: pc.collection.name,
      slug: pc.collection.slug,
    })),
    sizeGuide: product.sizeGuide
      ? {
          id: product.sizeGuide.id,
          name: product.sizeGuide.name,
          chart: product.sizeGuide.chart,
          notes: product.sizeGuide.notes,
        }
      : null,
    reviews: options.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      authorName: `${review.user.firstName} ${review.user.lastName.slice(0, 1).toUpperCase()}.`,
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
    })),
    rating: {
      average: card.rating.average,
      count: card.rating.count,
      distribution: options.reviewStats?.distribution ?? {},
    },
    related: options.related.map(toProductCard),
  };
}

export function availableOf(variant: { inventory: { onHand: number; reserved: number; damaged: number }[] }) {
  return available(variant);
}
