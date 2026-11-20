import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@dayshift/db";
import { COMMERCE, generateOrderNumber, toCents } from "@dayshift/config";
import { PrismaService } from "../../prisma/prisma.module";
import { CartService, CartContext, cartInclude } from "../cart/cart.service";
import { PricingService } from "../pricing/pricing.service";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";
import { AuthUser } from "../../common/types";
import { randomToken } from "../../common/crypto";
import { CheckoutDto, QuoteDto } from "./checkout.dto";
import { orderInclude, toOrderDetail } from "../orders/orders.mapper";
import type { CheckoutCart } from "../cart/cart.service";

type CartRow = CheckoutCart;

function effectiveCents(item: CartRow["items"][number]) {
  return toCents(item.variant.priceOverride ?? item.variant.product.price);
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger("Checkout");
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cartService: CartService,
    private readonly pricing: PricingService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  private pricingItems(cart: CartRow) {
    return cart.items.map((item) => ({
      id: item.id,
      productId: item.variant.productId,
      categoryIds: item.variant.product.categories.map((c) => c.categoryId),
      collectionIds: item.variant.product.collections.map((c) => c.collectionId),
      unitPrice: (effectiveCents(item) / 100).toFixed(2),
      quantity: item.quantity,
    }));
  }

  private shippingOptions() {
    return Object.values(COMMERCE.shipping).map((method) => ({
      code: method.code,
      label: method.label,
      description: method.description,
      price: (method.priceCents / 100).toFixed(2),
      freeOver: method.freeOverCents !== null ? (method.freeOverCents / 100).toFixed(2) : null,
    }));
  }

  async quote(context: CartContext, dto: QuoteDto) {
    const cart = await this.cartService.cartForCheckout(context);
    if (!cart.items.length) throw AppError.validation("Your bag is empty.");
    await this.inventory.validateStock(
      cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    );
    const quote = await this.pricing.quote({
      items: this.pricingItems(cart),
      couponCode: dto.couponCode ?? cart.couponCode,
      userId: context.user?.id,
      email: context.user?.email,
      shippingMethod: dto.shippingMethod ?? "standard",
      strict: false,
    });
    const selected = cart.items.map((item) => {
      const line = quote.pricing.lines.find((entry) => entry.id === item.id);
      return {
        cartItemId: item.id,
        variantId: item.variantId,
        name: item.variant.product.name,
        size: item.variant.size,
        color: item.variant.color,
        imageUrl: item.variant.imageUrl ?? item.variant.product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPrice: (effectiveCents(item) / 100).toFixed(2),
        lineTotal: ((line?.finalLineTotalCents ?? 0) / 100).toFixed(2),
      };
    });
    return {
      items: selected,
      shippingMethod: dto.shippingMethod ?? "standard",
      shippingOptions: this.shippingOptions(),
      subtotal: (quote.pricing.subtotalCents / 100).toFixed(2),
      discountTotal: (quote.pricing.discountTotalCents / 100).toFixed(2),
      shippingTotal: (quote.pricing.shippingCents / 100).toFixed(2),
      taxTotal: (quote.pricing.taxCents / 100).toFixed(2),
      total: (quote.pricing.totalCents / 100).toFixed(2),
      taxRate: quote.taxRate,
      coupon: quote.coupon,
      promotion: quote.pricing.appliedPromotion
        ? {
            name: quote.pricing.appliedPromotion.name,
            amount: (quote.pricing.appliedPromotion.amountCents / 100).toFixed(2),
          }
        : null,
    };
  }

  async checkout(context: CartContext, dto: CheckoutDto) {
    const email = dto.email.trim().toLowerCase();
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: orderInclude,
      });
      if (existing) {
        if (context.user && existing.userId !== context.user.id) {
          throw AppError.forbidden("This checkout belongs to another account.");
        }
        if (!context.user && existing.email !== email) {
          throw AppError.forbidden("This checkout belongs to another customer.");
        }
        const payment = existing.payments[0];
        return {
          order: toOrderDetail(existing),
          payment: payment
            ? {
                reference: payment.providerRef,
                method: payment.method,
                amount: Number(payment.amount.toString()).toFixed(2),
                status: payment.status,
                sandbox: payment.provider === "sandbox",
              }
            : null,
          duplicate: true,
        };
      }
    }

    const cart = await this.cartService.cartForCheckout(context);
    if (!cart.items.length) throw AppError.validation("Your bag is empty.");
    await this.inventory.validateStock(
      cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    );

    const quote = await this.pricing.quote({
      items: this.pricingItems(cart),
      couponCode: dto.couponCode ?? cart.couponCode,
      userId: context.user?.id,
      email,
      shippingMethod: dto.shippingMethod,
      strict: true,
    });

    if (dto.paymentMethod === "CASH_ON_DELIVERY") {
      const setting = await this.prisma.setting.findUnique({ where: { key: "payments" } });
      const enabled = (setting?.value as { cashOnDelivery?: boolean } | null)?.cashOnDelivery;
      if (!enabled) throw AppError.validation("Cash on delivery is not available.");
    }

    const isCod = dto.paymentMethod === "CASH_ON_DELIVERY";
    const expiresAt = new Date(Date.now() + COMMERCE.reservationMinutes * 60_000);
    const taxBase = quote.pricing.lines.reduce((sum, line) => sum + line.finalLineTotalCents, 0);
    const itemSnapshots = cart.items.map((item) => {
      const priced = quote.pricing.lines.find((line) => line.id === item.id)!;
      const taxShare =
        taxBase > 0
          ? Math.round((quote.pricing.taxCents * priced.finalLineTotalCents) / taxBase)
          : 0;
      return { item, priced, taxShare };
    });

    let orderId: string | null = null;
    for (let attempt = 0; attempt < 4 && !orderId; attempt += 1) {
      const orderNumber = generateOrderNumber();
      const providerRef = `sbx_${randomToken(12)}`;
      try {
        orderId = await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: context.user?.id ?? null,
              email,
              guestToken: null,
              status: isCod ? "PROCESSING" : "PENDING_PAYMENT",
              paymentStatus: "PENDING",
              subtotal: new Prisma.Decimal((quote.pricing.subtotalCents / 100).toFixed(2)),
              discountTotal: new Prisma.Decimal((quote.pricing.discountTotalCents / 100).toFixed(2)),
              shippingTotal: new Prisma.Decimal((quote.pricing.shippingCents / 100).toFixed(2)),
              taxTotal: new Prisma.Decimal((quote.pricing.taxCents / 100).toFixed(2)),
              grandTotal: new Prisma.Decimal((quote.pricing.totalCents / 100).toFixed(2)),
              currency: cart.currency,
              couponCode: quote.coupon?.valid ? quote.coupon.code : null,
              customerNote: dto.customerNote ?? null,
              shippingMethod: dto.shippingMethod,
              shippingAddress: {
                firstName: dto.shippingAddress.firstName,
                lastName: dto.shippingAddress.lastName,
                line1: dto.shippingAddress.line1,
                line2: dto.shippingAddress.line2 ?? null,
                city: dto.shippingAddress.city,
                state: dto.shippingAddress.state ?? null,
                postalCode: dto.shippingAddress.postalCode,
                country: dto.shippingAddress.country.toUpperCase(),
                phone: dto.shippingAddress.phone ?? null,
              },
              billingAddress: {
                firstName: dto.shippingAddress.firstName,
                lastName: dto.shippingAddress.lastName,
                line1: dto.shippingAddress.line1,
                line2: dto.shippingAddress.line2 ?? null,
                city: dto.shippingAddress.city,
                state: dto.shippingAddress.state ?? null,
                postalCode: dto.shippingAddress.postalCode,
                country: dto.shippingAddress.country.toUpperCase(),
                phone: dto.shippingAddress.phone ?? null,
              },
              idempotencyKey: dto.idempotencyKey,
              items: {
                create: itemSnapshots.map(({ item, priced, taxShare }) => {
                  return {
                    variantId: item.variantId,
                    productId: item.variant.productId,
                    productName: item.variant.product.name,
                    productSlug: item.variant.product.slug,
                    brandName: item.variant.product.brand?.name ?? null,
                    variantSku: item.variant.sku,
                    size: item.variant.size,
                    color: item.variant.color,
                    imageUrl: item.variant.imageUrl ?? item.variant.product.images[0]?.url ?? null,
                    quantity: item.quantity,
                    unitPrice: new Prisma.Decimal((priced.unitPriceCents / 100).toFixed(2)),
                    lineTotal: new Prisma.Decimal((priced.lineTotalCents / 100).toFixed(2)),
                    discountAllocated: new Prisma.Decimal(
                      (priced.discountCents / 100).toFixed(2),
                    ),
                    taxAmount: new Prisma.Decimal((taxShare / 100).toFixed(2)),
                  };
                }),
              },
            },
          });

          await this.inventory.reserve(tx, {
            orderId: order.id,
            cartId: cart.id,
            expiresAt,
            lines: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
          });

          await tx.payment.create({
            data: {
              orderId: order.id,
              provider: "sandbox",
              method: isCod ? "CASH_ON_DELIVERY" : "SANDBOX_CARD",
              status: "PENDING",
              amount: new Prisma.Decimal((quote.pricing.totalCents / 100).toFixed(2)),
              currency: cart.currency,
              providerRef,
              clientSecret: isCod ? null : randomToken(16),
            },
          });

          if (isCod) {
            await this.inventory.commitForOrder(tx, order.id);
            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                toStatus: "PROCESSING",
                actorType: "CUSTOMER",
                reason: "Cash on delivery order placed",
              },
            });
          } else {
            await tx.orderStatusHistory.create({
              data: {
                orderId: order.id,
                toStatus: "PENDING_PAYMENT",
                actorType: "CUSTOMER",
                reason: "Order submitted; awaiting payment",
              },
            });
          }

          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          await tx.cart.update({
            where: { id: cart.id },
            data: {
              status: "CONVERTED",
              couponCode: null,
              ...(context.user ? {} : { guestToken: null }),
            },
          });

          if (dto.saveAddress && context.user) {
            await tx.address.create({
              data: {
                userId: context.user.id,
                label: dto.shippingAddress.label ?? "Checkout address",
                firstName: dto.shippingAddress.firstName,
                lastName: dto.shippingAddress.lastName,
                line1: dto.shippingAddress.line1,
                line2: dto.shippingAddress.line2,
                city: dto.shippingAddress.city,
                state: dto.shippingAddress.state,
                postalCode: dto.shippingAddress.postalCode,
                country: dto.shippingAddress.country.toUpperCase(),
                phone: dto.shippingAddress.phone,
              },
            });
          }

          return order.id;
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = String(error.meta?.target ?? "");
          if (target.includes("orderNumber") && attempt < 3) {
            continue;
          }
        }
        throw error;
      }
    }
    if (!orderId) throw AppError.conflict("Could not place the order. Please try again.");

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: orderInclude,
    });
    const payment = order.payments[0];

    if (isCod) {
      await this.notifications.email({
        userId: context.user?.id,
        to: email,
        template: "order-confirmation",
        data: {
          firstName: dto.shippingAddress.firstName,
          orderNumber: order.orderNumber,
          totalCents: toCents(order.grandTotal),
          currency: order.currency,
          url: `${this.config.get("APP_URL") ?? "http://localhost:3000"}/account/orders/${order.orderNumber}`,
        },
        dedupeKey: `order-confirmation:${order.id}`,
      });
    }

    await this.audit.log({
      actorType: context.user ? "CUSTOMER" : "CUSTOMER",
      actorId: context.user?.id,
      actorEmail: email,
      action: "order.created",
      entityType: "Order",
      entityId: order.id,
      after: {
        orderNumber: order.orderNumber,
        total: order.grandTotal.toString(),
        paymentMethod: dto.paymentMethod,
      },
    });

    return {
      order: toOrderDetail(order),
      payment: {
        reference: payment.providerRef,
        method: payment.method,
        amount: Number(payment.amount.toString()).toFixed(2),
        status: payment.status,
        sandbox: true,
      },
      duplicate: false,
    };
  }

  async priceCartForCustomer(cartId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
    if (!cart) throw AppError.notFound("Cart not found");
    return cart;
  }
}
