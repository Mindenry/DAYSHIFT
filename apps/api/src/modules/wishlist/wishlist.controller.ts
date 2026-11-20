import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PrismaService } from "../../prisma/prisma.module";
import { CurrentUser } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { AppError } from "../../common/app-error";
import { productInclude, toProductCard } from "../catalog/catalog.mapper";
import { CartService } from "../cart/cart.service";

class AddWishlistItemDto {
  @IsString() productId!: string;
  @IsOptional() @IsString() variantId?: string;
}

class MoveToCartDto {
  @IsOptional()
  @IsString()
  variantId?: string;
}

@ApiTags("wishlist")
@ApiCookieAuth("ds_session")
@Controller("wishlist")
export class WishlistController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
  ) {}

  private async wishlistFor(userId: string) {
    return this.prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  @Get()
  async get(@CurrentUser() user: AuthUser) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          orderBy: { addedAt: "desc" },
          include: {
            product: { include: productInclude },
            variant: true,
          },
        },
      },
    });
    if (!wishlist) return { items: [] };
    return {
      items: wishlist.items.map((item) => ({
        id: item.id,
        addedAt: item.addedAt,
        product: toProductCard(item.product),
        selectedVariant: item.variant
          ? { id: item.variant.id, size: item.variant.size, color: item.variant.color, sku: item.variant.sku }
          : null,
      })),
    };
  }

  @Post("items")
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistItemDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, status: "ACTIVE", visibility: "PUBLIC" },
      select: { id: true },
    });
    if (!product) throw AppError.notFound("Product not found");
    if (dto.variantId) {
      const variant = await this.prisma.variant.findFirst({
        where: { id: dto.variantId, productId: product.id, isActive: true },
        select: { id: true },
      });
      if (!variant) throw AppError.validation("That variant does not belong to this product.");
    }
    const wishlist = await this.wishlistFor(user.id);
    await this.prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
      update: { variantId: dto.variantId ?? null },
      create: { wishlistId: wishlist.id, productId: product.id, variantId: dto.variantId ?? null },
    });
    return { added: true };
  }

  @Delete("items/:productId")
  async remove(@CurrentUser() user: AuthUser, @Param("productId") productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { userId: user.id } });
    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({
        where: { wishlistId: wishlist.id, productId },
      });
    }
    return { removed: true };
  }

  @Post("items/:productId/move-to-cart")
  async moveToCart(
    @CurrentUser() user: AuthUser,
    @Param("productId") productId: string,
    @Body() dto: MoveToCartDto,
  ) {
    let variantId = dto.variantId;
    if (!variantId) {
      const candidates = await this.prisma.variant.findMany({
        where: { productId, isActive: true, inventory: { some: { onHand: { gt: 0 } } } },
        include: { inventory: { select: { onHand: true, reserved: true, damaged: true } } },
        orderBy: { position: "asc" },
      });
      const available = candidates.find((candidate) =>
        candidate.inventory.some((row) => row.onHand - row.reserved - row.damaged > 0),
      );
      if (!available) throw AppError.conflict("This piece is currently out of stock.");
      variantId = available.id;
    }
    const variant = await this.prisma.variant.findFirst({
      where: { id: variantId, productId, isActive: true },
      select: { id: true },
    });
    if (!variant) throw AppError.validation("Choose an available size and colour first.");
    const result = await this.cartService.addItem({ user }, variant.id, 1);
    const wishlist = await this.prisma.wishlist.findUnique({ where: { userId: user.id } });
    if (wishlist) {
      await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
    }
    return result.cart;
  }
}
