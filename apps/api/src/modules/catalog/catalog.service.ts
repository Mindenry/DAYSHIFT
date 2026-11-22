import { Injectable } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { CacheService } from "../../redis/cache.service";
import { getPaging, paged } from "../../common/pagination";
import { AppError } from "../../common/app-error";
import { currentLocale, pickNullable, pickText } from "../../common/locale";
import { ProductQueryDto, ReviewQueryDto } from "./catalog.dto";
import {
  availableOf,
  productInclude,
  toProductCard,
  toProductDetail,
} from "./catalog.mapper";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ── Categories & collections ──────────────────────────────────────────
  async categoryTree() {
    const cacheKey = `catalog:categories:${currentLocale()}`;
    const cached = await this.cache.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    const byParent = new Map<string | null, typeof categories>();
    for (const category of categories) {
      const list = byParent.get(category.parentId) ?? [];
      list.push(category);
      byParent.set(category.parentId, list);
    }
    const mapNode = (category: (typeof categories)[number]): unknown => ({
      id: category.id,
      name: pickText(category.name, category.nameEn),
      slug: category.slug,
      description: pickNullable(category.description, category.descriptionEn),
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      productCount: category._count.products,
      children: (byParent.get(category.id) ?? []).map(mapNode),
    });
    const tree = (byParent.get(null) ?? []).map(mapNode);
    await this.cache.set(cacheKey, tree, 300);
    return tree;
  }

  async category(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { parent: true, children: { where: { isActive: true } } },
    });
    if (!category || !category.isActive) throw AppError.notFound("Category not found");
    const breadcrumbs: Array<{ id: string; name: string; slug: string }> = [];
    let cursorId: string | null = category.id;
    let depth = 0;
    while (cursorId && depth < 5) {
      const node: { id: string; name: string; nameEn: string | null; slug: string; parentId: string | null } | null =
        await this.prisma.category.findUnique({
          where: { id: cursorId },
          select: { id: true, name: true, nameEn: true, slug: true, parentId: true },
        });
      if (!node) break;
      breadcrumbs.unshift({ id: node.id, name: pickText(node.name, node.nameEn), slug: node.slug });
      cursorId = node.parentId;
      depth += 1;
    }
    return {
      id: category.id,
      name: pickText(category.name, category.nameEn),
      slug: category.slug,
      description: pickNullable(category.description, category.descriptionEn),
      imageUrl: category.imageUrl,
      metaTitle: pickNullable(category.metaTitle, category.metaTitleEn),
      metaDescription: pickNullable(category.metaDescription, category.metaDescriptionEn),
      children: category.children.map((child) => ({
        id: child.id,
        name: pickText(child.name, child.nameEn),
        slug: child.slug,
        imageUrl: child.imageUrl,
      })),
      breadcrumbs,
    };
  }

  async collections() {
    const cacheKey = `catalog:collections:${currentLocale()}`;
    const cached = await this.cache.get<unknown[]>(cacheKey);
    if (cached) return cached;
    const now = new Date();
    const collections = await this.prisma.collection.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    const mapped = collections.map((collection) => ({
      id: collection.id,
      name: pickText(collection.name, collection.nameEn),
      slug: collection.slug,
      description: pickNullable(collection.description, collection.descriptionEn),
      imageUrl: collection.imageUrl,
      type: collection.type,
      productCount: collection._count.products,
    }));
    await this.cache.set(cacheKey, mapped, 300);
    return mapped;
  }

  async collection(slug: string) {
    const now = new Date();
    const collection = await this.prisma.collection.findUnique({ where: { slug } });
    if (
      !collection ||
      !collection.isActive ||
      (collection.startsAt && collection.startsAt > now) ||
      (collection.endsAt && collection.endsAt < now)
    ) {
      throw AppError.notFound("Collection not found");
    }
    return {
      id: collection.id,
      name: pickText(collection.name, collection.nameEn),
      slug: collection.slug,
      description: pickNullable(collection.description, collection.descriptionEn),
      imageUrl: collection.imageUrl,
      type: collection.type,
      metaTitle: pickNullable(collection.metaTitle, collection.metaTitleEn),
      metaDescription: pickNullable(collection.metaDescription, collection.metaDescriptionEn),
    };
  }

  async brands() {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, description: true, descriptionEn: true },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: pickNullable(brand.description, brand.descriptionEn),
    }));
  }

  // ── Product listing ──────────────────────────────────────────────────
  private async categoryIdsForSlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: { select: { id: true, children: { select: { id: true } } } } },
    });
    if (!category) return null;
    const ids = [category.id];
    category.children.forEach((child) => {
      ids.push(child.id);
      child.children.forEach((grandchild) => ids.push(grandchild.id));
    });
    return ids;
  }

  private async productIdsForQuery(q: string) {
    const term = q.trim();
    if (!term) return [];
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id FROM "Product"
      WHERE status::text = 'ACTIVE' AND visibility::text = 'PUBLIC'
        AND (
          to_tsvector('simple',
            coalesce(name,'') || ' ' ||
            coalesce("nameEn",'') || ' ' ||
            coalesce("shortDescription",'') || ' ' ||
            coalesce("shortDescriptionEn",'') || ' ' ||
            coalesce(description,'') || ' ' ||
            coalesce("descriptionEn",'') || ' ' ||
            coalesce(sku,'') || ' ' ||
            array_to_string(tags, ' ') || ' ' ||
            array_to_string("tagsEn", ' ')
          ) @@ websearch_to_tsquery('simple', ${term})
          OR name ILIKE ${"%" + term + "%"}
          OR "nameEn" ILIKE ${"%" + term + "%"}
          OR sku ILIKE ${"%" + term + "%"}
        )
      LIMIT 300
    `);
    return rows.map((row) => row.id);
  }

  private async inStockIds() {
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT DISTINCT v."productId" AS id
      FROM "Variant" v
      JOIN "Inventory" i ON i."variantId" = v.id
      WHERE v."isActive" = true AND (i."onHand" - i."reserved" - i."damaged") > 0
    `);
    return rows.map((row) => row.id);
  }

  async listProducts(query: ProductQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query, 24, 60);
    const and: Prisma.ProductWhereInput[] = [
      { status: "ACTIVE", visibility: "PUBLIC" },
    ];

    if (query.category) {
      const ids = await this.categoryIdsForSlug(query.category);
      if (!ids) return paged([], 0, page, pageSize);
      and.push({ categories: { some: { categoryId: { in: ids } } } });
    }
    if (query.collection) {
      and.push({ collections: { some: { collection: { slug: query.collection, isActive: true } } } });
    }
    if (query.brand) {
      and.push({ brand: { slug: query.brand } });
    }
    if (query.q) {
      const ids = await this.productIdsForQuery(query.q);
      if (!ids.length) return paged([], 0, page, pageSize);
      and.push({ id: { in: ids } });
    }
    if (query.size) {
      and.push({ variants: { some: { size: query.size, isActive: true } } });
    }
    if (query.color) {
      and.push({
        variants: { some: { color: { equals: query.color, mode: "insensitive" }, isActive: true } },
      });
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const price: Prisma.DecimalFilter = {};
      if (query.minPrice !== undefined) price.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice !== undefined) price.lte = new Prisma.Decimal(query.maxPrice);
      and.push({ price });
    }
    if (query.inStock === "true") {
      const ids = await this.inStockIds();
      and.push({ id: { in: ids } });
    }

    const where: Prisma.ProductWhereInput = { AND: and };
    const sort = query.sort ?? "newest";

    let orderBy: Prisma.ProductOrderByWithRelationInput = { publishedAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "popular" || sort === "rating") {
      return this.listRanked(where, sort, page, pageSize);
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take,
      }),
    ]);
    return paged(products.map(toProductCard), total, page, pageSize);
  }

  /** Popularity and rating are aggregated across real orders and reviews. */
  private async listRanked(
    where: Prisma.ProductWhereInput,
    sort: "popular" | "rating",
    page: number,
    pageSize: number,
  ) {
    const candidates = await this.prisma.product.findMany({
      where,
      select: { id: true },
      take: 500,
    });
    const ids = candidates.map((c) => c.id);
    if (!ids.length) return paged([], 0, page, pageSize);

    let scores = new Map<string, number>();
    if (sort === "popular") {
      const rows = await this.prisma.$queryRaw<Array<{ id: string; score: bigint }>>(Prisma.sql`
        SELECT oi."productId" AS id, SUM(oi.quantity)::bigint AS score
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        WHERE o.status::text NOT IN ('CANCELLED', 'PAYMENT_FAILED')
          AND oi."productId" IN (${Prisma.join(ids)})
        GROUP BY oi."productId"
      `);
      scores = new Map(rows.map((row) => [row.id, Number(row.score)]));
    } else {
      const rows = await this.prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: ids }, status: "APPROVED" },
        _avg: { rating: true },
        _count: { rating: true },
      });
      scores = new Map(
        rows.map((row) => [row.productId, (row._avg.rating ?? 0) * 10 + row._count.rating / 100]),
      );
    }

    const ordered = [...ids].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
    const pageIds = ordered.slice((page - 1) * pageSize, page * pageSize);
    const products = await this.prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: productInclude,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return paged(
      pageIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p).map(toProductCard),
      ordered.length,
      page,
      pageSize,
    );
  }

  async product(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: "ACTIVE", visibility: "PUBLIC" },
      include: productInclude,
    });
    if (!product) throw AppError.notFound("Product not found");

    const primaryCategoryId = product.categories[0]?.categoryId;
    const [reviews, totalReviews, related, distribution] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId: product.id, status: "APPROVED" },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      this.prisma.review.count({ where: { productId: product.id, status: "APPROVED" } }),
      this.prisma.product.findMany({
        where: {
          id: { not: product.id },
          status: "ACTIVE",
          visibility: "PUBLIC",
          ...(primaryCategoryId
            ? { categories: { some: { categoryId: primaryCategoryId } } }
            : {}),
        },
        include: productInclude,
        take: 4,
        orderBy: { publishedAt: "desc" },
      }),
      this.prisma.review.groupBy({
        by: ["rating"],
        where: { productId: product.id, status: "APPROVED" },
        _count: { rating: true },
      }),
    ]);

    const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    distribution.forEach((row) => {
      dist[String(row.rating)] = row._count.rating;
    });

    return {
      ...toProductDetail(product, {
        reviews,
        related,
        reviewStats: { distribution: dist },
      }),
      reviewTotal: totalReviews,
    };
  }

  async productReviews(slug: string, query: ReviewQueryDto) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: "ACTIVE", visibility: "PUBLIC" },
      select: { id: true },
    });
    if (!product) throw AppError.notFound("Product not found");
    const { page, pageSize, skip, take } = getPaging(query, 10, 50);
    const where = { productId: product.id, status: "APPROVED" as const };
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      this.prisma.review.count({ where }),
    ]);
    return paged(
      items.map((review) => ({
        id: review.id,
        rating: review.rating,
        title: pickNullable(review.title, review.titleEn),
        body: pickText(review.body, review.bodyEn),
        authorName: `${review.user.firstName} ${review.user.lastName.slice(0, 1).toUpperCase()}.`,
        isVerifiedPurchase: review.isVerifiedPurchase,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  async facets(query: ProductQueryDto) {
    const and: Prisma.ProductWhereInput[] = [{ status: "ACTIVE", visibility: "PUBLIC" }];
    if (query.category) {
      const ids = await this.categoryIdsForSlug(query.category);
      if (ids) and.push({ categories: { some: { categoryId: { in: ids } } } });
    }
    if (query.collection) {
      and.push({ collections: { some: { collection: { slug: query.collection } } } });
    }
    if (query.q) {
      const ids = await this.productIdsForQuery(query.q);
      and.push({ id: { in: ids.length ? ids : ["__none__"] } });
    }

    const products = await this.prisma.product.findMany({
      where: { AND: and },
      select: {
        price: true,
        variants: {
          where: { isActive: true },
          select: { size: true, color: true, colorHex: true },
        },
      },
      take: 1000,
    });

    const sizes = new Map<string, number>();
    const colors = new Map<string, { name: string; hex: string | null; count: number }>();
    let min = Infinity;
    let max = 0;
    products.forEach((product) => {
      const price = Number(product.price.toString());
      min = Math.min(min, price);
      max = Math.max(max, price);
      product.variants.forEach((variant) => {
        if (variant.size) sizes.set(variant.size, (sizes.get(variant.size) ?? 0) + 1);
        if (variant.color) {
          const existing = colors.get(variant.color);
          if (existing) existing.count += 1;
          else colors.set(variant.color, { name: variant.color, hex: variant.colorHex, count: 1 });
        }
      });
    });

    return {
      sizes: Array.from(sizes.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
      colors: Array.from(colors.values()).sort((a, b) => a.name.localeCompare(b.name)),
      price: {
        min: Number.isFinite(min) ? min : 0,
        max,
      },
    };
  }

  async suggestions(q: string) {
    const term = q.trim();
    if (term.length < 2) return { products: [], categories: [], collections: [] };
    const [products, categories, collections] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          status: "ACTIVE",
          visibility: "PUBLIC",
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameEn: { contains: term, mode: "insensitive" } },
            { sku: { contains: term, mode: "insensitive" } },
            { tags: { has: term.toLowerCase() } },
            { tagsEn: { has: term.toLowerCase() } },
          ],
        },
        select: {
          id: true,
          name: true,
          nameEn: true,
          slug: true,
          price: true,
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        },
        take: 6,
        orderBy: { isFeatured: "desc" },
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameEn: { contains: term, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, nameEn: true, slug: true },
        take: 4,
      }),
      this.prisma.collection.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { nameEn: { contains: term, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, nameEn: true, slug: true },
        take: 3,
      }),
    ]);
    return {
      products: products.map((p) => ({
        id: p.id,
        name: pickText(p.name, p.nameEn),
        slug: p.slug,
        price: p.price.toString(),
        image: p.images[0]?.url ?? null,
      })),
      categories: categories.map((c) => ({ id: c.id, name: pickText(c.name, c.nameEn), slug: c.slug })),
      collections: collections.map((c) => ({ id: c.id, name: pickText(c.name, c.nameEn), slug: c.slug })),
      popular: currentLocale() === "en"
        ? ["Linen shirt", "Oversized tee", "Straight jeans", "Leather tote", "Merino knit"]
        : ["เสื้อลินิน", "เสื้อยืดโอเวอร์ไซซ์", "กางเกงยีนส์ขาตรง", "กระเป๋าโท้ต", "ไหมพรมเมอริโน"],
    };
  }

  async featured(limit = 8) {
    const products = await this.prisma.product.findMany({
      where: { status: "ACTIVE", visibility: "PUBLIC", isFeatured: true },
      include: productInclude,
      take: limit,
      orderBy: { publishedAt: "desc" },
    });
    return products.map(toProductCard);
  }

  async variantAvailability(variantId: string) {
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: { inventory: { select: { onHand: true, reserved: true, damaged: true } } },
    });
    if (!variant) throw AppError.notFound("Variant not found");
    return { variantId, available: availableOf(variant), inStock: availableOf(variant) > 0 };
  }
}
