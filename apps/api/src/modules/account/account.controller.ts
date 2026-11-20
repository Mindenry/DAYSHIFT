import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { CurrentUser } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { AppError } from "../../common/app-error";
import { paged } from "../../common/pagination";
import { AddressDto } from "./account.dto";

@ApiTags("account")
@ApiCookieAuth("ds_session")
@Controller("account")
export class AccountController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly loyalty: LoyaltyService,
  ) {}

  @Get("overview")
  async overview(@CurrentUser() user: AuthUser) {
    const [orders, orderCount, wishlistCount, returns, notifications] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          grandTotal: true,
          currency: true,
          createdAt: true,
        },
      }),
      this.prisma.order.count({ where: { userId: user.id } }),
      this.prisma.wishlistItem.count({ where: { wishlist: { userId: user.id } } }),
      this.prisma.returnRequest.count({
        where: { userId: user.id, status: { notIn: ["CLOSED", "CANCELLED", "REJECTED"] } },
      }),
      this.notifications.unreadCount(user.id),
    ]);
    const loyalty = await this.loyalty.summary(user.id);
    const addresses = await this.prisma.address.count({ where: { userId: user.id } });
    return {
      user,
      recentOrders: orders,
      orderCount,
      wishlistCount,
      openReturns: returns,
      unreadNotifications: notifications,
      addressCount: addresses,
      loyalty: {
        pointsBalance: loyalty.pointsBalance,
        tier: loyalty.tier,
        nextTier: loyalty.nextTier,
        valueCents: loyalty.valueCents,
      },
    };
  }

  @Get("addresses")
  async addresses(@CurrentUser() user: AuthUser) {
    return this.prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
    });
  }

  @Post("addresses")
  async createAddress(@CurrentUser() user: AuthUser, @Body() dto: AddressDto) {
    if (dto.isDefaultShipping) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (dto.isDefaultBilling) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId: user.id,
        label: dto.label,
        firstName: dto.firstName,
        lastName: dto.lastName,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country.toUpperCase(),
        phone: dto.phone,
        isDefaultShipping: dto.isDefaultShipping ?? false,
        isDefaultBilling: dto.isDefaultBilling ?? false,
      },
    });
  }

  @Patch("addresses/:id")
  async updateAddress(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: AddressDto,
  ) {
    const existing = await this.prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw AppError.notFound("Address not found");
    if (dto.isDefaultShipping) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, id: { not: id }, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }
    if (dto.isDefaultBilling) {
      await this.prisma.address.updateMany({
        where: { userId: user.id, id: { not: id }, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }
    return this.prisma.address.update({
      where: { id },
      data: {
        label: dto.label,
        firstName: dto.firstName,
        lastName: dto.lastName,
        line1: dto.line1,
        line2: dto.line2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country.toUpperCase(),
        phone: dto.phone,
        ...(dto.isDefaultShipping !== undefined ? { isDefaultShipping: dto.isDefaultShipping } : {}),
        ...(dto.isDefaultBilling !== undefined ? { isDefaultBilling: dto.isDefaultBilling } : {}),
      },
    });
  }

  @Delete("addresses/:id")
  async deleteAddress(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const existing = await this.prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw AppError.notFound("Address not found");
    await this.prisma.address.delete({ where: { id } });
    return { deleted: true };
  }

  @Get("notifications")
  async notificationList(@CurrentUser() user: AuthUser) {
    const { items, total } = await this.notifications.listForUser(user.id, 1, 50);
    return paged(items, total, 1, 50);
  }

  @Post("notifications/:id/read")
  async readNotification(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    await this.notifications.markRead(user.id, id);
    return { read: true };
  }

  @Post("notifications/read-all")
  async readAll(@CurrentUser() user: AuthUser) {
    await this.notifications.markAllRead(user.id);
    return { read: true };
  }

  @Get("loyalty")
  loyaltySummary(@CurrentUser() user: AuthUser) {
    return this.loyalty.summary(user.id);
  }

  @Get("export")
  async exportData(@CurrentUser() user: AuthUser) {
    const [profile, addresses, orders, reviews, returns] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true },
      }),
      this.prisma.address.findMany({ where: { userId: user.id } }),
      this.prisma.order.findMany({
        where: { userId: user.id },
        select: { orderNumber: true, status: true, grandTotal: true, createdAt: true },
      }),
      this.prisma.review.findMany({
        where: { userId: user.id },
        select: { productId: true, rating: true, body: true, createdAt: true },
      }),
      this.prisma.returnRequest.findMany({
        where: { userId: user.id },
        select: { returnNumber: true, status: true, requestedAt: true },
      }),
    ]);
    return { exportedAt: new Date(), profile, addresses, orders, reviews, returns };
  }
}
