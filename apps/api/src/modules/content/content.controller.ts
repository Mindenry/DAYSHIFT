import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../../prisma/prisma.module";
import { Public } from "../../common/decorators";
import { productInclude, toProductCard } from "../catalog/catalog.mapper";
import { AppError } from "../../common/app-error";
import { pickNullable, pickText } from "../../common/locale";

class NewsletterDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsOptional() @IsString() @MaxLength(40) source?: string;
}

@ApiTags("content")
@Public()
@Controller("content")
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  private async blocks(keys: string[]) {
    const now = new Date();
    const rows = await this.prisma.contentBlock.findMany({
      where: {
        key: { in: keys },
        status: "PUBLISHED",
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { position: "asc" },
    });
    return Object.fromEntries(
      rows.map((row) => [
        row.key,
        {
          ...row,
          title: pickNullable(row.title, row.titleEn),
          subtitle: pickNullable(row.subtitle, row.subtitleEn),
          body: pickNullable(row.body, row.bodyEn),
          ctaLabel: pickNullable(row.ctaLabel, row.ctaLabelEn),
        },
      ]),
    );
  }

  @Get("home")
  async home() {
    const [blocks, navigation, categories, collections, featured, newArrivals, bestSellers] =
      await Promise.all([
        this.blocks([
          "home.hero",
          "home.editorial.women",
          "home.editorial.men",
          "home.campaign.seasonal",
          "announcement.bar",
        ]),
        this.prisma.navigationItem.findMany({
          where: { isActive: true, parentId: null },
          orderBy: { position: "asc" },
          include: { children: { orderBy: { position: "asc" } } },
        }),
        this.prisma.category.findMany({
          where: { isActive: true, parentId: null },
          orderBy: { position: "asc" },
          select: { id: true, name: true, nameEn: true, slug: true, imageUrl: true },
        }),
        this.prisma.collection.findMany({
          where: {
            isActive: true,
            OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
          },
          orderBy: { position: "asc" },
          select: {
            id: true,
            name: true,
            nameEn: true,
            slug: true,
            description: true,
            descriptionEn: true,
            imageUrl: true,
            type: true,
          },
        }),
        this.prisma.product.findMany({
          where: { status: "ACTIVE", visibility: "PUBLIC", isFeatured: true },
          include: productInclude,
          take: 8,
          orderBy: { publishedAt: "desc" },
        }),
        this.prisma.product.findMany({
          where: { status: "ACTIVE", visibility: "PUBLIC" },
          include: productInclude,
          take: 8,
          orderBy: { publishedAt: "desc" },
        }),
        this.prisma.product.findMany({
          where: {
            status: "ACTIVE",
            visibility: "PUBLIC",
            collections: { some: { collection: { slug: "best-sellers" } } },
          },
          include: productInclude,
          take: 8,
        }),
      ]);

    return {
      hero: blocks["home.hero"] ?? null,
      announcement: blocks["announcement.bar"] ?? null,
      editorial: [blocks["home.editorial.women"], blocks["home.editorial.men"]].filter(Boolean),
      campaign: blocks["home.campaign.seasonal"] ?? null,
      navigation: navigation.map((item) => ({
        ...item,
        label: pickText(item.label, item.labelEn),
        children: item.children.map((child) => ({ ...child, label: pickText(child.label, child.labelEn) })),
      })),
      categories: categories.map((category) => ({
        ...category,
        name: pickText(category.name, category.nameEn),
        nameEn: undefined,
      })),
      collections: collections.map((collection) => ({
        ...collection,
        name: pickText(collection.name, collection.nameEn),
        description: pickNullable(collection.description, collection.descriptionEn),
        nameEn: undefined,
        descriptionEn: undefined,
      })),
      featured: featured.map(toProductCard),
      newArrivals: newArrivals.map(toProductCard),
      bestSellers: bestSellers.map(toProductCard),
    };
  }

  @Get("pages/:key")
  async page(@Param("key") key: string) {
    const block = await this.prisma.contentBlock.findUnique({ where: { key } });
    if (!block || block.status !== "PUBLISHED") throw AppError.notFound("Page not found");
    return {
      ...block,
      title: pickNullable(block.title, block.titleEn),
      subtitle: pickNullable(block.subtitle, block.subtitleEn),
      body: pickNullable(block.body, block.bodyEn),
      ctaLabel: pickNullable(block.ctaLabel, block.ctaLabelEn),
    };
  }

  @Get("navigation")
  async navigation() {
    const items = await this.prisma.navigationItem.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { position: "asc" },
      include: { children: { orderBy: { position: "asc" } } },
    });
    return items.map((item) => ({
      ...item,
      label: pickText(item.label, item.labelEn),
      children: item.children.map((child) => ({ ...child, label: pickText(child.label, child.labelEn) })),
    }));
  }

  @Get("settings")
  async publicSettings() {
    const rows = await this.prisma.setting.findMany({
      where: { key: { in: ["store", "shipping", "returns", "loyalty", "tax"] } },
    });
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  }

  @Get("sitemap")
  async sitemap() {
    const [products, categories, collections] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: "ACTIVE", visibility: "PUBLIC" },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      this.prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return { products, categories, collections };
  }

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post("newsletter")
  async newsletter(@Body() dto: NewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { unsubscribedAt: null, confirmedAt: new Date() },
      create: { email, source: dto.source ?? "homepage", confirmedAt: new Date() },
    });
    return { subscribed: true };
  }
}
