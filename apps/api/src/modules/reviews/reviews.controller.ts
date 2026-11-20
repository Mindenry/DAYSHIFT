import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.module";
import { CurrentUser } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { AppError } from "../../common/app-error";
import { CreateReviewDto } from "./reviews.dto";

@ApiTags("reviews")
@ApiCookieAuth("ds_session")
@Controller("reviews")
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("mine")
  async mine(@CurrentUser() user: AuthUser) {
    return this.prisma.review.findMany({
      where: { userId: user.id },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!product) throw AppError.notFound("Product not found");

    const setting = await this.prisma.setting.findUnique({ where: { key: "features" } });
    const requirePurchase =
      (setting?.value as { reviewsRequirePurchase?: boolean } | null)?.reviewsRequirePurchase ?? true;

    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: user.id,
          status: { in: ["DELIVERED", "COMPLETED", "PARTIALLY_RETURNED"] },
        },
      },
      select: { id: true },
    });
    if (requirePurchase && !purchase) {
      throw AppError.forbidden("Only customers who have received this item can review it.");
    }

    const existing = await this.prisma.review.findUnique({
      where: { productId_userId: { productId: product.id, userId: user.id } },
    });
    if (existing) throw AppError.conflict("You have already reviewed this product.");

    return this.prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: dto.rating,
        title: dto.title || null,
        body: dto.body,
        status: "PENDING",
        isVerifiedPurchase: !!purchase,
      },
      select: { id: true, rating: true, title: true, body: true, status: true, createdAt: true },
    });
  }

  @Post(":id/helpful")
  async helpful(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review || review.status !== "APPROVED") throw AppError.notFound("Review not found");
    if (review.userId === user.id) throw AppError.validation("You cannot vote on your own review.");
    const existing = await this.prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId: id, userId: user.id } },
    });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.reviewVote.delete({ where: { reviewId_userId: { reviewId: id, userId: user.id } } }),
        this.prisma.review.update({ where: { id }, data: { helpfulCount: { decrement: 1 } } }),
      ]);
      return { helpful: false, count: Math.max(0, review.helpfulCount - 1) };
    }
    await this.prisma.$transaction([
      this.prisma.reviewVote.create({ data: { reviewId: id, userId: user.id } }),
      this.prisma.review.update({ where: { id }, data: { helpfulCount: { increment: 1 } } }),
    ]);
    return { helpful: true, count: review.helpfulCount + 1 };
  }
}
