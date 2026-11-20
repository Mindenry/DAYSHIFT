import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { toCents } from "@dayshift/config";
import { PrismaService } from "../../prisma/prisma.module";
import { PricingService } from "../pricing/pricing.service";
import { AppError } from "../../common/app-error";
import { AuthUser } from "../../common/types";
import { randomToken } from "../../common/crypto";

const MAX_QUANTITY = 10;

export const cartInclude = {
  items: {
    orderBy: { addedAt: "asc" as const },
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              images: { orderBy: { position: "asc" as const }, take: 2 },
              categories: true,
              collections: true,
              brand: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
export type CheckoutCart = CartWithItems;

export interface CartContext {
  user?: AuthUser;
  guestToken?: string;
}

export interface CartResult {
  cart: Record<string, unknown>;
  issuedGuestToken?: string;
  merged?: boolean;
}

function available(variant: { inventory: { onHand: number; reserved: number; damaged: number }[] }) {
  return variant.inventory.reduce(
    (sum, item) => sum + Math.max(0, item.onHand - item.reserved - item.damaged),
    0,
  );
}

@Injectable()
export class CartService {
  private readonly logger = new Logger("Cart");
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  private async resolve(context: CartContext): Promise<{ cart: CartWithItems; issuedGuestToken?: string }> {
    if (context.user) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId: context.user.id, status: "ACTIVE" },
        include: cartInclude,
        orderBy: { updatedAt: "desc" },
      });

      if (context.guestToken) {
        const guest = await this.prisma.cart.findUnique({
          where: { guestToken: context.guestToken },
          include: cartInclude,
        });
        if (guest && guest.status === "ACTIVE") {
          if (!cart) {
            cart = await this.prisma.cart.update({
              where: { id: guest.id },
              data: { userId: context.user.id, guestToken: null },
              include: cartInclude,
            });
          } else {
            for (const item of guest.items) {
              const existing = cart.items.find((i) => i.variantId === item.variantId);
              const quantity = Math.min(MAX_QUANTITY, (existing?.quantity ?? 0) + item.quantity);
              if (existing) {
                await this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
              } else {
                await this.prisma.cartItem.create({
                  data: { cartId: cart.id, variantId: item.variantId, quantity, unitPrice: item.unitPrice },
                });
              }
            }
            await this.prisma.cart.update({
              where: { id: guest.id },
              data: { status: "MERGED", guestToken: null },
            });
            cart = await this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
          }
        }
      }

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: { userId: context.user.id },
          include: cartInclude,
        });
      }
      return { cart };
    }

    if (context.guestToken) {
      const cart = await this.prisma.cart.findUnique({
        where: { guestToken: context.guestToken },
        include: cartInclude,
      });
      if (cart && cart.status === "ACTIVE" && (!cart.expiresAt || cart.expiresAt > new Date())) {
        return { cart };
      }
    }
    const token = randomToken(24);
    const cart = await this.prisma.cart.create({
      data: {
        guestToken: token,
        expiresAt: new Date(Date.now() + 90 * 86_400_000),
      },
      include: cartInclude,
    });
    return { cart, issuedGuestToken: token };
  }

  private effectiveCents(variant: CartWithItems["items"][number]["variant"]) {
    return toCents(variant.priceOverride ?? variant.product.price);
  }

  private async present(cart: CartWithItems, context: CartContext): Promise<Record<string, unknown>> {
    const items = cart.items;
    const quote = await this.pricing.quote({
      items: items.map((item) => ({
        id: item.id,
        productId: item.variant.productId,
        categoryIds: item.variant.product.categories.map((c) => c.categoryId),
        collectionIds: item.variant.product.collections.map((c) => c.collectionId),
        unitPrice: (this.effectiveCents(item.variant) / 100).toFixed(2),
        quantity: item.quantity,
      })),
      couponCode: cart.couponCode,
      userId: context.user?.id,
      shippingMethod: "standard",
      strict: false,
    });

    const warnings: string[] = [];
    const lines = items.map((item) => {
      const stock = available(item.variant);
      const effective = this.effectiveCents(item.variant);
      const inStock = stock >= item.quantity;
      if (!inStock) {
        warnings.push(
          stock === 0
            ? `${item.variant.product.name} (${item.variant.size ?? "One size"}) is out of stock.`
            : `Only ${stock} left of ${item.variant.product.name} (${item.variant.size ?? "One size"}).`,
        );
      }
      const priced = quote.pricing.lines.find((line) => line.id === item.id);
      return {
        id: item.id,
        variantId: item.variantId,
        productId: item.variant.productId,
        productName: item.variant.product.name,
        productSlug: item.variant.product.slug,
        variantSku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
        imageUrl: item.variant.imageUrl ?? item.variant.product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPrice: (effective / 100).toFixed(2),
        lineTotal: ((priced?.lineTotalCents ?? effective * item.quantity) / 100).toFixed(2),
        availableStock: stock,
        inStock,
      };
    });

    if (cart.couponCode && !quote.coupon?.valid) {
      warnings.push(quote.coupon?.reason ?? "Your discount code is no longer valid.");
    }

    return {
      id: cart.id,
      currency: cart.currency,
      lines,
      itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: (quote.pricing.subtotalCents / 100).toFixed(2),
      couponCode: cart.couponCode,
      discountTotal: (quote.pricing.discountTotalCents / 100).toFixed(2),
      shippingEstimate: (quote.pricing.shippingCents / 100).toFixed(2),
      taxEstimate: (quote.pricing.taxCents / 100).toFixed(2),
      totalEstimate: (quote.pricing.totalCents / 100).toFixed(2),
      coupon: quote.coupon
        ? {
            code: quote.coupon.code,
            description: quote.coupon.description,
            amount: quote.coupon.amount,
            valid: quote.coupon.valid,
          }
        : null,
      warnings,
    };
  }

  async get(context: CartContext): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    return { cart: await this.present(cart, context), issuedGuestToken };
  }

  async addItem(context: CartContext, variantId: string, quantity: number): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    const variant = await this.prisma.variant.findUnique({
      where: { id: variantId },
      include: {
        inventory: true,
        product: { include: { categories: true, collections: true, images: true } },
      },
    });
    if (!variant || !variant.isActive || variant.product.status !== "ACTIVE") {
      throw AppError.notFound("That product is no longer available.");
    }
    const stock = available(variant);
    if (stock <= 0) throw AppError.conflict("That size and colour is out of stock.");
    const existing = cart.items.find((item) => item.variantId === variantId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > MAX_QUANTITY) {
      throw AppError.validation(`You can order up to ${MAX_QUANTITY} of this item.`);
    }
    if (nextQuantity > stock) {
      throw AppError.conflict(`Only ${stock} available in that size and colour.`);
    }

    const price = (toCents(variant.priceOverride ?? variant.product.price) / 100).toFixed(2);
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQuantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId: cart.id, variantId, quantity, unitPrice: price },
      });
    }
    await this.prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async updateItem(context: CartContext, itemId: string, quantity: number): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) throw AppError.notFound("Cart item not found");
    const stock = available(item.variant);
    if (quantity > stock) {
      throw AppError.conflict(stock === 0 ? "This item is out of stock." : `Only ${stock} available.`);
    }
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async removeItem(context: CartContext, itemId: string): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    const item = cart.items.find((entry) => entry.id === itemId);
    if (!item) throw AppError.notFound("Cart item not found");
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async clear(context: CartContext): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async applyCoupon(context: CartContext, code: string): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    const normalized = code.trim().toUpperCase();
    if (!cart.items.length) throw AppError.validation("Add an item before applying a code.");
    await this.pricing.quote({
      items: cart.items.map((item) => ({
        id: item.id,
        productId: item.variant.productId,
        categoryIds: item.variant.product.categories.map((c) => c.categoryId),
        collectionIds: item.variant.product.collections.map((c) => c.collectionId),
        unitPrice: (this.effectiveCents(item.variant) / 100).toFixed(2),
        quantity: item.quantity,
      })),
      couponCode: normalized,
      userId: context.user?.id,
      shippingMethod: "standard",
      strict: true,
    });
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponCode: normalized } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async removeCoupon(context: CartContext): Promise<CartResult> {
    const { cart, issuedGuestToken } = await this.resolve(context);
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    const refreshed = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return { cart: await this.present(refreshed, context), issuedGuestToken };
  }

  async mergeGuestCart(user: AuthUser, guestToken: string): Promise<CartResult> {
    const result = await this.resolve({ user, guestToken });
    return { cart: await this.present(result.cart, { user }), merged: true };
  }

  async cartForCheckout(context: CartContext) {
    const { cart } = await this.resolve(context);
    return cart;
  }
}
