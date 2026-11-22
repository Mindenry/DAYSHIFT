import { Injectable } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { CacheService } from "../../redis/cache.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";
import { getPaging, paged } from "../../common/pagination";
import {
  AdminProductQueryDto,
  BrandInputDto,
  CategoryInputDto,
  CollectionInputDto,
  CreateProductDto,
  UpdateProductDto,
  UpdateBrandDto,
  VariantInputDto,
  VariantUpdateDto,
} from "./admin-catalog.dto";

export interface AdminActor {
  id: string;
  email: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  private async invalidate() {
    await this.cache.delByPrefix("catalog:");
  }

  private validateImage(url: string) {
    if (!url.startsWith("/") && !/^https:\/\//.test(url)) {
      throw AppError.validation("Images must use a local path or an https URL.");
    }
  }

  async listProducts(query: AdminProductQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query);
    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { sku: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.category
        ? { categories: { some: { category: { slug: query.category } } } }
        : {}),
    };
    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          categories: { include: { category: { select: { name: true, nameEn: true, slug: true } } } },
          variants: { include: { inventory: { select: { onHand: true, reserved: true, damaged: true } } } },
          _count: { select: { variants: true } },
        },
      }),
    ]);
    return paged(
      products.map((product) => ({
        id: product.id,
        name: product.name,
        nameEn: product.nameEn,
        slug: product.slug,
        sku: product.sku,
        status: product.status,
        price: product.price.toString(),
        compareAtPrice: product.compareAtPrice?.toString() ?? null,
        image: product.images[0]?.url ?? null,
        variantCount: product._count.variants,
        stock: product.variants.reduce(
          (sum, variant) =>
            sum +
            variant.inventory.reduce(
              (s, row) => s + Math.max(0, row.onHand - row.reserved - row.damaged),
              0,
            ),
          0,
        ),
        categories: product.categories.map((pc) => pc.category.name),
        categoriesEn: product.categories.map((pc) => pc.category.nameEn ?? pc.category.name),
        updatedAt: product.updatedAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: "asc" } },
        categories: { include: { category: true } },
        collections: { include: { collection: true } },
        brand: true,
        sizeGuide: true,
        variants: {
          orderBy: { position: "asc" },
          include: { inventory: { include: { warehouse: true } } },
        },
      },
    });
    if (!product) throw AppError.notFound("Product not found");
    return product;
  }

  async createProduct(dto: CreateProductDto, actor: AdminActor) {
    if (!SLUG.test(dto.slug)) throw AppError.validation("Slug must be lowercase words separated by hyphens.");
    (dto.images ?? []).forEach((image) => this.validateImage(image.url));
    const variants = dto.variants ?? [];
    if (!variants.length) throw AppError.validation("Add at least one variant.");

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: dto.name,
          nameEn: dto.nameEn || dto.name,
          slug: dto.slug,
          sku: dto.sku,
          shortDescription: dto.shortDescription || null,
          shortDescriptionEn: dto.shortDescriptionEn || null,
          description: dto.description,
          descriptionEn: dto.descriptionEn || dto.description,
          brandId: dto.brandId || null,
          status: dto.status as never,
          visibility: dto.visibility as never,
          price: new Prisma.Decimal(dto.price),
          compareAtPrice: dto.compareAtPrice != null ? new Prisma.Decimal(dto.compareAtPrice) : null,
          costPrice: dto.costPrice != null ? new Prisma.Decimal(dto.costPrice) : null,
          material: dto.material || null,
          materialEn: dto.materialEn || null,
          careInstructions: dto.careInstructions || null,
          careInstructionsEn: dto.careInstructionsEn || null,
          fitNotes: dto.fitNotes || null,
          fitNotesEn: dto.fitNotesEn || null,
          features: dto.features ?? [],
          featuresEn: dto.featuresEn ?? [],
          tags: dto.tags ?? [],
          tagsEn: dto.tagsEn ?? [],
          isFeatured: dto.isFeatured ?? false,
          metaTitle: dto.metaTitle || null,
          metaTitleEn: dto.metaTitleEn || null,
          metaDescription: dto.metaDescription || null,
          metaDescriptionEn: dto.metaDescriptionEn || null,
          publishedAt: dto.status === "ACTIVE" ? new Date() : null,
          categories: {
            create: dto.categoryIds.map((id, index) => ({ categoryId: id, isPrimary: index === 0 })),
          },
          collections: {
            create: (dto.collectionIds ?? []).map((id, index) => ({ collectionId: id, position: index })),
          },
          images: {
            create: (dto.images ?? []).map((image, index) => ({
              url: image.url,
              alt: image.alt,
              color: image.color,
              position: index,
            })),
          },
        },
      });

      const warehouse =
        (await tx.warehouse.findFirst({ where: { isDefault: true, isActive: true } })) ??
        (await tx.warehouse.findFirst({ where: { isActive: true } }));
      if (!warehouse) throw AppError.conflict("Create a warehouse before adding products.");

      for (const [index, variant] of variants.entries()) {
        await tx.variant.create({
          data: {
            productId: created.id,
            sku: variant.sku,
            size: variant.size ?? "One Size",
            color: variant.color,
            colorHex: variant.colorHex,
            priceOverride: variant.priceOverride != null ? new Prisma.Decimal(variant.priceOverride) : null,
            barcode: variant.barcode || null,
            position: index,
            isActive: true,
          },
        });
        const stored = await tx.variant.findUniqueOrThrow({ where: { sku: variant.sku } });
        const initial = variant.initialStock ?? 0;
        await tx.inventory.create({
          data: {
            variantId: stored.id,
            warehouseId: warehouse.id,
            onHand: initial,
            reorderPoint: 5,
          },
        });
        if (initial > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: stored.id,
              warehouseId: warehouse.id,
              type: "STOCK_IN",
              quantity: initial,
              previousOnHand: 0,
              newOnHand: initial,
              reason: "Initial stock on product creation",
              referenceType: "ADMIN",
              actorId: actor.id,
            },
          });
        }
      }
      return created;
    });

    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "product.created",
      entityType: "Product",
      entityId: product.id,
      after: { name: dto.name, sku: dto.sku, status: dto.status },
    });
    return this.getProduct(product.id);
  }

  async updateProduct(id: string, dto: UpdateProductDto, actor: AdminActor) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound("Product not found");
    if (dto.slug && !SLUG.test(dto.slug)) throw AppError.validation("Invalid slug.");
    (dto.images ?? []).forEach((image) => this.validateImage(image.url));

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn || null } : {}),
          ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
          ...(dto.sku !== undefined ? { sku: dto.sku } : {}),
          ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription || null } : {}),
          ...(dto.shortDescriptionEn !== undefined ? { shortDescriptionEn: dto.shortDescriptionEn || null } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.descriptionEn !== undefined ? { descriptionEn: dto.descriptionEn || null } : {}),
          ...(dto.brandId !== undefined ? { brandId: dto.brandId || null } : {}),
          ...(dto.status !== undefined
            ? {
                status: dto.status as never,
                publishedAt:
                  dto.status === "ACTIVE" && !existing.publishedAt ? new Date() : existing.publishedAt,
              }
            : {}),
          ...(dto.visibility !== undefined ? { visibility: dto.visibility as never } : {}),
          ...(dto.price !== undefined ? { price: new Prisma.Decimal(dto.price) } : {}),
          ...(dto.compareAtPrice !== undefined
            ? { compareAtPrice: dto.compareAtPrice == null ? null : new Prisma.Decimal(dto.compareAtPrice) }
            : {}),
          ...(dto.costPrice !== undefined
            ? { costPrice: dto.costPrice == null ? null : new Prisma.Decimal(dto.costPrice) }
            : {}),
          ...(dto.material !== undefined ? { material: dto.material || null } : {}),
          ...(dto.materialEn !== undefined ? { materialEn: dto.materialEn || null } : {}),
          ...(dto.careInstructions !== undefined ? { careInstructions: dto.careInstructions || null } : {}),
          ...(dto.careInstructionsEn !== undefined ? { careInstructionsEn: dto.careInstructionsEn || null } : {}),
          ...(dto.fitNotes !== undefined ? { fitNotes: dto.fitNotes || null } : {}),
          ...(dto.fitNotesEn !== undefined ? { fitNotesEn: dto.fitNotesEn || null } : {}),
          ...(dto.features !== undefined ? { features: dto.features } : {}),
          ...(dto.featuresEn !== undefined ? { featuresEn: dto.featuresEn } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.tagsEn !== undefined ? { tagsEn: dto.tagsEn } : {}),
          ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
          ...(dto.metaTitle !== undefined ? { metaTitle: dto.metaTitle || null } : {}),
          ...(dto.metaTitleEn !== undefined ? { metaTitleEn: dto.metaTitleEn || null } : {}),
          ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription || null } : {}),
          ...(dto.metaDescriptionEn !== undefined ? { metaDescriptionEn: dto.metaDescriptionEn || null } : {}),
        },
      });
      if (dto.categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: dto.categoryIds.map((categoryId, index) => ({
            productId: id,
            categoryId,
            isPrimary: index === 0,
          })),
        });
      }
      if (dto.collectionIds) {
        await tx.productCollection.deleteMany({ where: { productId: id } });
        if (dto.collectionIds.length) {
          await tx.productCollection.createMany({
            data: dto.collectionIds.map((collectionId, index) => ({
              productId: id,
              collectionId,
              position: index,
            })),
          });
        }
      }
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.images.length) {
          await tx.productImage.createMany({
            data: dto.images.map((image, index) => ({
              productId: id,
              url: image.url,
              alt: image.alt,
              color: image.color,
              position: index,
            })),
          });
        }
      }
    });

    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "product.updated",
      entityType: "Product",
      entityId: id,
      before: { name: existing.name, status: existing.status, price: existing.price.toString() },
      after: { name: dto.name, status: dto.status, price: dto.price },
    });
    return this.getProduct(id);
  }

  async duplicateProduct(id: string, actor: AdminActor) {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, categories: true, collections: true, variants: true },
    });
    if (!source) throw AppError.notFound("Product not found");
    let suffix = 1;
    let slug = `${source.slug}-copy`;
    while (await this.prisma.product.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${source.slug}-copy-${suffix}`;
    }
    const duplicate = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: `${source.name} (Copy)`,
          slug,
          sku: `${source.sku}-COPY${suffix > 1 ? suffix : ""}`,
          shortDescription: source.shortDescription,
          description: source.description,
          brandId: source.brandId,
          status: "DRAFT",
          visibility: "HIDDEN",
          price: source.price,
          compareAtPrice: source.compareAtPrice,
          costPrice: source.costPrice,
          material: source.material,
          careInstructions: source.careInstructions,
          fitNotes: source.fitNotes,
          features: source.features,
          tags: source.tags,
          metaTitle: source.metaTitle,
          metaDescription: source.metaDescription,
          categories: {
            create: source.categories.map((pc) => ({
              categoryId: pc.categoryId,
              isPrimary: pc.isPrimary,
            })),
          },
          collections: {
            create: source.collections.map((pc) => ({
              collectionId: pc.collectionId,
              position: pc.position,
            })),
          },
          images: {
            create: source.images.map((image) => ({
              url: image.url,
              alt: image.alt,
              color: image.color,
              position: image.position,
            })),
          },
        },
      });
      for (const variant of source.variants) {
        await tx.variant.create({
          data: {
            productId: created.id,
            sku: `${variant.sku}-COPY${suffix > 1 ? suffix : ""}`.slice(0, 60),
            size: variant.size,
            color: variant.color,
            colorHex: variant.colorHex,
            priceOverride: variant.priceOverride,
            position: variant.position,
            isActive: variant.isActive,
          },
        });
      }
      return created;
    });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "product.duplicated",
      entityType: "Product",
      entityId: duplicate.id,
      after: { sourceId: id, name: duplicate.name },
    });
    return this.getProduct(duplicate.id);
  }

  async bulkProducts(ids: string[], action: string, actor: AdminActor) {
    const data =
      action === "activate"
        ? { status: "ACTIVE" as const, publishedAt: new Date() }
        : action === "archive"
          ? { status: "ARCHIVED" as const }
          : action === "draft"
            ? { status: "DRAFT" as const }
            : action === "feature"
              ? { isFeatured: true }
              : { isFeatured: false };
    const result = await this.prisma.product.updateMany({ where: { id: { in: ids } }, data });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: `product.bulk_${action}`,
      entityType: "Product",
      entityId: ids.join(","),
      after: { count: result.count },
    });
    return { updated: result.count };
  }

  async createVariant(productId: string, dto: VariantInputDto, actor: AdminActor) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw AppError.notFound("Product not found");
    const warehouse =
      (await this.prisma.warehouse.findFirst({ where: { isDefault: true } })) ??
      (await this.prisma.warehouse.findFirst({ where: { isActive: true } }));
    if (!warehouse) throw AppError.conflict("Create a warehouse first.");
    const variant = await this.prisma.variant.create({
      data: {
        productId,
        sku: dto.sku,
        size: dto.size ?? "One Size",
        color: dto.color,
        colorHex: dto.colorHex,
        priceOverride: dto.priceOverride != null ? new Prisma.Decimal(dto.priceOverride) : null,
        barcode: dto.barcode || null,
        inventory: {
          create: { warehouseId: warehouse.id, onHand: dto.initialStock ?? 0 },
        },
      },
      include: { inventory: true },
    });
    if ((dto.initialStock ?? 0) > 0) {
      await this.prisma.inventoryMovement.create({
        data: {
          variantId: variant.id,
          warehouseId: warehouse.id,
          type: "STOCK_IN",
          quantity: dto.initialStock!,
          previousOnHand: 0,
          newOnHand: dto.initialStock!,
          reason: "Initial stock on variant creation",
          referenceType: "ADMIN",
          actorId: actor.id,
        },
      });
    }
    await this.invalidate();
    return variant;
  }

  async updateVariant(id: string, dto: VariantUpdateDto, actor: AdminActor) {
    const variant = await this.prisma.variant.findUnique({ where: { id } });
    if (!variant) throw AppError.notFound("Variant not found");
    const updated = await this.prisma.variant.update({
      where: { id },
      data: {
        ...(dto.size !== undefined ? { size: dto.size } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.colorHex !== undefined ? { colorHex: dto.colorHex } : {}),
        ...(dto.priceOverride !== undefined
          ? { priceOverride: dto.priceOverride === null ? null : new Prisma.Decimal(dto.priceOverride) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode || null } : {}),
      },
    });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "variant.updated",
      entityType: "Variant",
      entityId: id,
      after: dto,
    });
    return updated;
  }

  async deactivateVariant(id: string, actor: AdminActor) {
    const referenced = await this.prisma.orderItem.count({ where: { variantId: id } });
    if (referenced > 0) {
      await this.prisma.variant.update({ where: { id }, data: { isActive: false } });
      return { deactivated: true, deleted: false };
    }
    await this.prisma.variant.update({ where: { id }, data: { isActive: false } });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "variant.deactivated",
      entityType: "Variant",
      entityId: id,
    });
    await this.invalidate();
    return { deactivated: true, deleted: false };
  }

  // ── Taxonomy ────────────────────────────────────────────────────────
  async categories() {
    return this.prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  async createCategory(dto: CategoryInputDto, actor: AdminActor) {
    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn || dto.name,
        slug: dto.slug,
        description: dto.description,
        descriptionEn: dto.descriptionEn || null,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId || null,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle,
        metaTitleEn: dto.metaTitleEn || null,
        metaDescription: dto.metaDescription,
        metaDescriptionEn: dto.metaDescriptionEn || null,
      },
    });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "category.created",
      entityType: "Category",
      entityId: category.id,
      after: { name: dto.name },
    });
    return category;
  }

  async updateCategory(id: string, dto: Record<string, unknown>, actor: AdminActor) {
    if (dto.parentId === id) throw AppError.validation("A category cannot be its own parent.");
    if (dto.parentId) {
      // Walk up from the proposed parent; if we reach this category, the
      // change would create a cycle and make the navigation tree unrenderable.
      let cursor: string | null = dto.parentId as string;
      let depth = 0;
      while (cursor && depth < 50) {
        if (cursor === id) {
          throw AppError.validation("A category cannot be moved beneath one of its own descendants.");
        }
        const parent: { parentId: string | null } | null = await this.prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
        cursor = parent?.parentId ?? null;
        depth += 1;
      }
    }
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name as string } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: (dto.nameEn as string) || null } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug as string } : {}),
        ...(dto.description !== undefined ? { description: dto.description as string } : {}),
        ...(dto.descriptionEn !== undefined ? { descriptionEn: (dto.descriptionEn as string) || null } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl as string } : {}),
        ...(dto.parentId !== undefined ? { parentId: (dto.parentId as string) || null } : {}),
        ...(dto.position !== undefined ? { position: dto.position as number } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive as boolean } : {}),
        ...(dto.metaTitle !== undefined ? { metaTitle: dto.metaTitle as string } : {}),
        ...(dto.metaTitleEn !== undefined ? { metaTitleEn: (dto.metaTitleEn as string) || null } : {}),
        ...(dto.metaDescription !== undefined ? { metaDescription: dto.metaDescription as string } : {}),
        ...(dto.metaDescriptionEn !== undefined ? { metaDescriptionEn: (dto.metaDescriptionEn as string) || null } : {}),
      },
    });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "category.updated",
      entityType: "Category",
      entityId: id,
      after: dto,
    });
    return updated;
  }

  async deleteCategory(id: string, actor: AdminActor) {
    const [products, children] = await Promise.all([
      this.prisma.productCategory.count({ where: { categoryId: id } }),
      this.prisma.category.count({ where: { parentId: id } }),
    ]);
    if (products > 0 || children > 0) {
      throw AppError.conflict("Move products and child categories before deleting this category.");
    }
    await this.prisma.category.delete({ where: { id } });
    await this.invalidate();
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "category.deleted",
      entityType: "Category",
      entityId: id,
    });
    return { deleted: true };
  }

  async collections() {
    return this.prisma.collection.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  }

  async createCollection(dto: CollectionInputDto) {
    return this.prisma.collection.create({
      data: {
        name: dto.name,
        nameEn: dto.nameEn || dto.name,
        slug: dto.slug,
        description: dto.description,
        descriptionEn: dto.descriptionEn || null,
        imageUrl: dto.imageUrl,
        type: (dto.type ?? "EDITORIAL") as never,
        position: dto.position ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async updateCollection(id: string, dto: Record<string, unknown>) {
    const updated = await this.prisma.collection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name as string } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: (dto.nameEn as string) || null } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug as string } : {}),
        ...(dto.description !== undefined ? { description: dto.description as string } : {}),
        ...(dto.descriptionEn !== undefined ? { descriptionEn: (dto.descriptionEn as string) || null } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl as string } : {}),
        ...(dto.type !== undefined ? { type: dto.type as never } : {}),
        ...(dto.position !== undefined ? { position: dto.position as number } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive as boolean } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: dto.startsAt ? new Date(dto.startsAt as string) : null } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: dto.endsAt ? new Date(dto.endsAt as string) : null } : {}),
      },
    });
    await this.invalidate();
    return updated;
  }

  async brands() {
    return this.prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } });
  }

  async createBrand(dto: BrandInputDto) {
    return this.prisma.brand.create({ data: dto });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    return this.prisma.brand.update({ where: { id }, data: dto });
  }
}
