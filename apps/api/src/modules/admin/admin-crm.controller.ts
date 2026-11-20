import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { SupportService } from "../support/support.service";
import { AuditService } from "../audit/audit.service";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser, RequirePermissions } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { getPaging, paged } from "../../common/pagination";
import { AppError } from "../../common/app-error";
import {
  ContentBlockInputDto,
  CouponInputDto,
  CustomerQueryDto,
  LoyaltyAdjustDto,
  PromotionInputDto,
  ReviewModerationDto,
  TicketQueryDto,
  TicketReplyDto,
  TicketUpdateDto,
  UpdateCustomerDto,
} from "./admin-crm.dto";

const PAID = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] as const;

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/customers")
export class AdminCustomersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("customers.read")
  async list(@Query() query: CustomerQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query);
    const where: Prisma.UserWhereInput = {
      customerProfile: { isNot: null },
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.segment ? { customerProfile: { segment: query.segment } } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q, mode: "insensitive" } },
              { firstName: { contains: query.q, mode: "insensitive" } },
              { lastName: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          customerProfile: true,
          loyaltyAccount: { select: { pointsBalance: true, tier: true } },
          _count: { select: { orders: true } },
        },
      }),
    ]);
    const aggregates = await this.prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: users.map((u) => u.id) }, paymentStatus: { in: [...PAID] as unknown as never[] } },
      _sum: { grandTotal: true },
      _count: { id: true },
    });
    const spend = new Map(aggregates.map((row) => [row.userId, row._sum.grandTotal?.toString() ?? "0"]));
    return paged(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        status: user.status,
        segment: user.customerProfile?.segment,
        tags: user.customerProfile?.tags ?? [],
        orderCount: user._count.orders,
        totalSpent: Number(spend.get(user.id) ?? 0).toFixed(2),
        loyalty: user.loyaltyAccount,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
      total,
      page,
      pageSize,
    );
  }

  @Get("segments")
  @RequirePermissions("customers.read")
  async segments() {
    const now = new Date();
    const [total, returning, highValue, inactive, newCustomers] = await Promise.all([
      this.prisma.customerProfile.count(),
      this.prisma.user.count({ where: { customerProfile: { isNot: null }, orders: { some: {} } } }),
      this.prisma.loyaltyAccount.count({ where: { tier: { in: ["GOLD", "PLATINUM"] } } }),
      this.prisma.user.count({
        where: {
          customerProfile: { isNot: null },
          lastLoginAt: { lt: new Date(now.getTime() - 90 * 86_400_000) },
        },
      }),
      this.prisma.user.count({
        where: { customerProfile: { isNot: null }, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } },
      }),
    ]);
    return { total, returning, highValue, inactive, newCustomers };
  }

  @Get(":id")
  @RequirePermissions("customers.read")
  async detail(@Param("id") id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, customerProfile: { isNot: null } },
      include: {
        customerProfile: true,
        loyaltyAccount: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            grandTotal: true,
            createdAt: true,
          },
        },
        tickets: { orderBy: { createdAt: "desc" }, take: 10 },
        reviews: { orderBy: { createdAt: "desc" }, take: 10 },
        returnRequests: { orderBy: { requestedAt: "desc" }, take: 10 },
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw AppError.notFound("Customer not found");
    const spend = await this.prisma.order.aggregate({
      where: { userId: id, paymentStatus: { in: [...PAID] as unknown as never[] } },
      _sum: { grandTotal: true },
    });
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      profile: user.customerProfile,
      loyalty: user.loyaltyAccount,
      addresses: user.addresses,
      orders: user.orders.map((order) => ({ ...order, grandTotal: order.grandTotal.toString() })),
      orderCount: user._count.orders,
      totalSpent: Number(spend._sum.grandTotal ?? 0).toFixed(2),
      tickets: user.tickets,
      reviews: user.reviews,
      returns: user.returnRequests,
    };
  }

  @Patch(":id")
  @RequirePermissions("customers.update")
  async update(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    const user = await this.prisma.user.findFirst({ where: { id, customerProfile: { isNot: null } } });
    if (!user) throw AppError.notFound("Customer not found");
    if (dto.status) {
      await this.prisma.user.update({ where: { id }, data: { status: dto.status } });
    }
    if (dto.staffNotes !== undefined || dto.tags !== undefined || dto.segment !== undefined) {
      await this.prisma.customerProfile.update({
        where: { userId: id },
        data: {
          ...(dto.staffNotes !== undefined ? { staffNotes: dto.staffNotes } : {}),
          ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
          ...(dto.segment !== undefined ? { segment: dto.segment } : {}),
        },
      });
    }
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "customer.updated",
      entityType: "User",
      entityId: id,
      after: dto,
    });
    return this.detail(id);
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/tickets")
export class AdminTicketsController {
  constructor(
    private readonly support: SupportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermissions("tickets.read")
  list(@Query() query: TicketQueryDto) {
    return this.support.adminList(query);
  }

  @Get("agents")
  @RequirePermissions("tickets.read")
  agents() {
    return this.prisma.user.findMany({
      where: { staffProfile: { isActive: true } },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    });
  }

  @Get(":id")
  @RequirePermissions("tickets.read")
  detail(@Param("id") id: string) {
    return this.support.adminDetail(id);
  }

  @Post(":id/reply")
  @RequirePermissions("tickets.update")
  reply(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: TicketReplyDto) {
    return this.support.reply({ id: user.id, email: user.email }, id, dto.body, dto.internal ?? false);
  }

  @Patch(":id")
  @RequirePermissions("tickets.update")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: TicketUpdateDto) {
    return this.support.update({ id: user.id, email: user.email }, id, dto);
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/reviews")
export class AdminReviewsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("reviews.moderate")
  async list(@Query("status") status?: string, @Query("page") page?: string) {
    const paging = getPaging({ page }, 25);
    const where = status ? { status: status as never } : {};
    const [total, items] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.take,
        include: {
          product: { select: { name: true, slug: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);
    return paged(items, total, paging.page, paging.pageSize);
  }

  @Patch(":id")
  @RequirePermissions("reviews.moderate")
  async moderate(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ReviewModerationDto) {
    const review = await this.prisma.review.update({ where: { id }, data: { status: dto.status } });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "review.moderated",
      entityType: "Review",
      entityId: id,
      after: { status: dto.status },
    });
    return review;
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/coupons")
export class AdminCouponsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("marketing.manage")
  list() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { redemptions: true } },
        collections: true,
        categories: true,
        products: true,
      },
    });
  }

  @Post()
  @RequirePermissions("marketing.manage")
  async create(@CurrentUser() actor: AuthUser, @Body() dto: CouponInputDto) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        description: dto.description,
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        minOrderSubtotal: new Prisma.Decimal(dto.minOrderSubtotal ?? 0),
        maxDiscount: dto.maxDiscount != null ? new Prisma.Decimal(dto.maxDiscount) : null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        usageLimitTotal: dto.usageLimitTotal ?? null,
        usageLimitPerCustomer: dto.usageLimitPerCustomer ?? null,
        firstOrderOnly: dto.firstOrderOnly ?? false,
        stackable: dto.stackable ?? false,
        isActive: dto.isActive ?? true,
        collections: dto.collectionIds?.length
          ? { create: dto.collectionIds.map((collectionId) => ({ collectionId })) }
          : undefined,
        categories: dto.categoryIds?.length
          ? { create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
        products: dto.productIds?.length
          ? { create: dto.productIds.map((productId) => ({ productId })) }
          : undefined,
      },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "coupon.created",
      entityType: "Coupon",
      entityId: coupon.id,
      after: { code: coupon.code },
    });
    return coupon;
  }

  @Patch(":id")
  @RequirePermissions("marketing.manage")
  async update(@CurrentUser() actor: AuthUser, @Param("id") id: string, @Body() dto: Partial<CouponInputDto>) {
    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.value !== undefined ? { value: new Prisma.Decimal(dto.value) } : {}),
        ...(dto.minOrderSubtotal !== undefined ? { minOrderSubtotal: new Prisma.Decimal(dto.minOrderSubtotal) } : {}),
        ...(dto.maxDiscount !== undefined
          ? { maxDiscount: dto.maxDiscount == null ? null : new Prisma.Decimal(dto.maxDiscount) }
          : {}),
        ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
        ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
        ...(dto.usageLimitTotal !== undefined ? { usageLimitTotal: dto.usageLimitTotal } : {}),
        ...(dto.usageLimitPerCustomer !== undefined ? { usageLimitPerCustomer: dto.usageLimitPerCustomer } : {}),
        ...(dto.firstOrderOnly !== undefined ? { firstOrderOnly: dto.firstOrderOnly } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "coupon.updated",
      entityType: "Coupon",
      entityId: id,
      after: dto,
    });
    return coupon;
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/promotions")
export class AdminPromotionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("marketing.manage")
  list() {
    return this.prisma.promotion.findMany({
      orderBy: [{ isActive: "desc" }, { priority: "desc" }],
      include: { category: { select: { name: true } }, product: { select: { name: true } }, collection: { select: { name: true } } },
    });
  }

  @Post()
  @RequirePermissions("marketing.manage")
  create(@Body() dto: PromotionInputDto) {
    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: new Prisma.Decimal(dto.value),
        scope: dto.scope,
        categoryId: dto.scope === "CATEGORY" ? dto.categoryId : null,
        productId: dto.scope === "PRODUCT" ? dto.productId : null,
        collectionId: dto.scope === "COLLECTION" ? dto.collectionId : null,
        minSubtotal: new Prisma.Decimal(dto.minSubtotal ?? 0),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch(":id")
  @RequirePermissions("marketing.manage")
  update(@Param("id") id: string, @Body() dto: { isActive?: boolean; priority?: number; endsAt?: string }) {
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
      },
    });
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/loyalty")
export class AdminLoyaltyController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("loyalty.manage")
  async list() {
    const accounts = await this.prisma.loyaltyAccount.findMany({
      orderBy: { lifetimePoints: "desc" },
      take: 100,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    return accounts.map((account) => ({
      id: account.id,
      customer: `${account.user.firstName} ${account.user.lastName}`,
      email: account.user.email,
      pointsBalance: account.pointsBalance,
      lifetimePoints: account.lifetimePoints,
      tier: account.tier,
    }));
  }

  @Post(":accountId/adjust")
  @RequirePermissions("loyalty.manage")
  async adjust(
    @CurrentUser() actor: AuthUser,
    @Param("accountId") accountId: string,
    @Body() dto: LoyaltyAdjustDto,
  ) {
    const account = await this.prisma.loyaltyAccount.findUnique({ where: { id: accountId } });
    if (!account) throw AppError.notFound("Loyalty account not found");
    const next = account.pointsBalance + dto.points;
    if (next < 0) throw AppError.validation("Adjustment would make the balance negative.");
    await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: accountId },
        data: {
          pointsBalance: next,
          lifetimePoints: dto.points > 0 ? account.lifetimePoints + dto.points : account.lifetimePoints,
        },
      }),
      this.prisma.loyaltyTransaction.create({
        data: {
          accountId,
          type: "ADJUST",
          points: dto.points,
          reason: dto.reason,
        },
      }),
    ]);
    await this.audit.log({
      actorType: "STAFF",
      actorId: actor.id,
      actorEmail: actor.email,
      action: "loyalty.adjusted",
      entityType: "LoyaltyAccount",
      entityId: accountId,
      after: { points: dto.points, reason: dto.reason },
    });
    return { balance: next };
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/content")
export class AdminContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("content.manage")
  list() {
    return this.prisma.contentBlock.findMany({ orderBy: { position: "asc" } });
  }

  @Post()
  @RequirePermissions("content.manage")
  upsert(@Body() dto: ContentBlockInputDto) {
    return this.prisma.contentBlock.upsert({
      where: { key: dto.key },
      update: {
        title: dto.title,
        subtitle: dto.subtitle,
        body: dto.body,
        imageUrl: dto.imageUrl,
        ctaLabel: dto.ctaLabel,
        ctaUrl: dto.ctaUrl,
        position: dto.position ?? 0,
        status: (dto.status ?? "PUBLISHED") as never,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
      create: {
        key: dto.key,
        title: dto.title,
        subtitle: dto.subtitle,
        body: dto.body,
        imageUrl: dto.imageUrl,
        ctaLabel: dto.ctaLabel,
        ctaUrl: dto.ctaUrl,
        position: dto.position ?? 0,
        status: (dto.status ?? "PUBLISHED") as never,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  @Get("newsletter")
  @RequirePermissions("content.manage")
  newsletter() {
    return this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }
}
