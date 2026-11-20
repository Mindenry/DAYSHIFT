import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { NotificationsService } from "../notifications/notifications.service";
import { AuditService } from "../audit/audit.service";
import { AppError } from "../../common/app-error";
import { COMMERCE } from "@dayshift/config";
import { expireStaleReservations } from "@dayshift/db";

type Tx = Prisma.TransactionClient;

export interface ReserveLine {
  variantId: string;
  quantity: number;
}

interface InventoryRow {
  id: string;
  warehouseId: string;
  available: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger("Inventory");
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async availableForVariant(variantId: string): Promise<number> {
    const rows = await this.prisma.inventory.findMany({
      where: { variantId },
      select: { onHand: true, reserved: true, damaged: true },
    });
    return rows.reduce(
      (sum, row) => sum + Math.max(0, row.onHand - row.reserved - row.damaged),
      0,
    );
  }

  async availableMap(variantIds: string[]) {
    if (!variantIds.length) return new Map<string, number>();
    const rows = await this.prisma.inventory.groupBy({
      by: ["variantId"],
      where: { variantId: { in: variantIds } },
      _sum: { onHand: true, reserved: true, damaged: true },
    });
    return new Map(
      rows.map((row) => [
        row.variantId,
        Math.max(
          0,
          (row._sum.onHand ?? 0) - (row._sum.reserved ?? 0) - (row._sum.damaged ?? 0),
        ),
      ]),
    );
  }

  async validateStock(lines: ReserveLine[]): Promise<void> {
    const availability = await this.availableMap(lines.map((line) => line.variantId));
    for (const line of lines) {
      const available = availability.get(line.variantId) ?? 0;
      if (available < line.quantity) {
        throw AppError.conflict(
          available === 0
            ? "One of your items is no longer available."
            : `Only ${available} left of one of your items.`,
        );
      }
    }
  }

  /**
   * Reserves stock for an order across warehouses. Each conditional UPDATE is
   * the concurrency guard: two simultaneous checkouts cannot reserve the same
   * unit because the second update affects zero rows and aborts the transaction.
   */
  async reserve(
    tx: Tx,
    input: { orderId: string; cartId?: string | null; lines: ReserveLine[]; expiresAt: Date },
  ) {
    for (const line of input.lines) {
      const rows = await tx.$queryRaw<InventoryRow[]>(Prisma.sql`
        SELECT id, "warehouseId", ("onHand" - "reserved" - "damaged") AS available
        FROM "Inventory"
        WHERE "variantId" = ${line.variantId}
          AND ("onHand" - "reserved" - "damaged") > 0
        ORDER BY available DESC, "warehouseId" ASC
      `);
      const available = rows.reduce((sum, row) => sum + Number(row.available), 0);
      if (available < line.quantity) {
        throw AppError.conflict("One of your items just sold out. Please review your bag.");
      }
      let remaining = line.quantity;
      for (const row of rows) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, Number(row.available));
        if (take <= 0) continue;
        const updated = await tx.$executeRaw(Prisma.sql`
          UPDATE "Inventory"
          SET "reserved" = "reserved" + ${take}, "updatedAt" = NOW()
          WHERE id = ${row.id}
            AND ("onHand" - "reserved" - "damaged") >= ${take}
        `);
        if (updated !== 1) {
          throw AppError.conflict("Stock changed while you were checking out. Please try again.");
        }
        await tx.stockReservation.create({
          data: {
            variantId: line.variantId,
            warehouseId: row.warehouseId,
            quantity: take,
            status: "ACTIVE",
            cartId: input.cartId ?? null,
            orderId: input.orderId,
            expiresAt: input.expiresAt,
          },
        });
        remaining -= take;
      }
      if (remaining > 0) {
        throw AppError.conflict("One of your items just sold out. Please review your bag.");
      }
    }
  }

  /** Commits active reservations after a successful payment. */
  async commitForOrder(tx: Tx, orderId: string, reference = orderId) {
    const reservations = await tx.stockReservation.findMany({
      where: { orderId, status: "ACTIVE" },
    });
    for (const reservation of reservations) {
      const inventory = await tx.inventory.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
          },
        },
      });
      if (!inventory) throw AppError.conflict("Inventory record missing for reservation");
      const updated = await tx.$executeRaw(Prisma.sql`
        UPDATE "Inventory"
        SET "onHand" = "onHand" - ${reservation.quantity},
            "reserved" = "reserved" - ${reservation.quantity},
            "updatedAt" = NOW()
        WHERE "variantId" = ${reservation.variantId}
          AND "warehouseId" = ${reservation.warehouseId}
          AND "reserved" >= ${reservation.quantity}
          AND "onHand" >= ${reservation.quantity}
      `);
      if (updated !== 1) {
        throw AppError.conflict("Could not commit reserved stock. Please contact support.");
      }
      await tx.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          warehouseId: reservation.warehouseId,
          type: "SALE",
          quantity: -reservation.quantity,
          previousOnHand: inventory.onHand,
          newOnHand: inventory.onHand - reservation.quantity,
          reason: "Order paid",
          referenceType: "Order",
          referenceId: reference,
        },
      });
      await tx.stockReservation.update({
        where: { id: reservation.id },
        data: { status: "COMMITTED" },
      });
    }
  }

  async releaseForOrder(orderId: string, reason: string) {
    await this.prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId, status: "ACTIVE" },
      });
      for (const reservation of reservations) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "Inventory"
          SET "reserved" = GREATEST(0, "reserved" - ${reservation.quantity}), "updatedAt" = NOW()
          WHERE "variantId" = ${reservation.variantId} AND "warehouseId" = ${reservation.warehouseId}
        `);
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: "RELEASED", releasedAt: new Date() },
        });
      }
      await this.audit.log({
        action: "inventory.reservations_released",
        entityType: "Order",
        entityId: orderId,
        after: { reason, count: reservations.length },
      });
    });
  }

  /**
   * Expires timed-out reservations. Orders still awaiting payment are cancelled
   * and their payment attempts voided. Idempotent: only ACTIVE rows are touched.
   */
  async expireReservations(): Promise<number> {
    return expireStaleReservations(this.prisma);
  }

  async adjust(input: {
    warehouseId: string;
    variantId: string;
    quantityDelta: number;
    reason: string;
    actorId?: string;
    actorEmail?: string;
    type?: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "DAMAGE" | "RECONCILIATION";
  }) {
    if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
      throw AppError.validation("Quantity change must be a non-zero whole number.");
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventory.findUnique({
        where: {
          variantId_warehouseId: { variantId: input.variantId, warehouseId: input.warehouseId },
        },
      });
      const inventory =
        existing ??
        (await tx.inventory.create({
          data: { variantId: input.variantId, warehouseId: input.warehouseId },
        }));
      const previous = inventory.onHand;
      const next = previous + input.quantityDelta;
      if (next < 0) throw AppError.validation("Stock cannot go below zero.");
      if (input.type === "DAMAGE" && next < inventory.reserved) {
        throw AppError.validation("Damaged stock would fall below reserved quantity.");
      }
      const updated = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          onHand: next,
          ...(input.type === "DAMAGE" ? { damaged: inventory.damaged + Math.abs(input.quantityDelta) } : {}),
        },
      });
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          type: input.type ?? (input.quantityDelta > 0 ? "STOCK_IN" : "STOCK_OUT"),
          quantity: input.quantityDelta,
          previousOnHand: previous,
          newOnHand: next,
          reason: input.reason,
          referenceType: "MANUAL",
          actorId: input.actorId ?? null,
        },
      });
      await this.audit.log({
        actorType: input.actorId ? "STAFF" : "SYSTEM",
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: "inventory.adjusted",
        entityType: "Inventory",
        entityId: inventory.id,
        before: { onHand: previous, reserved: inventory.reserved },
        after: { onHand: next, reason: input.reason },
      });
      return { inventory: updated, movement };
    });
    await this.maybeLowStock(input.variantId, input.warehouseId);
    return result;
  }

  async transfer(input: {
    variantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason?: string;
    actorId?: string;
    actorEmail?: string;
  }) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw AppError.validation("Choose two different warehouses.");
    }
    if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
      throw AppError.validation("Transfer quantity must be a positive whole number.");
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const from = await tx.inventory.findUnique({
        where: {
          variantId_warehouseId: {
            variantId: input.variantId,
            warehouseId: input.fromWarehouseId,
          },
        },
      });
      if (!from) throw AppError.notFound("Source inventory not found");
      const available = from.onHand - from.reserved - from.damaged;
      if (available < input.quantity) {
        throw AppError.conflict(`Only ${available} units are available to transfer.`);
      }
      const fromNext = from.onHand - input.quantity;
      const to =
        (await tx.inventory.findUnique({
          where: {
            variantId_warehouseId: {
              variantId: input.variantId,
              warehouseId: input.toWarehouseId,
            },
          },
        })) ??
        (await tx.inventory.create({
          data: { variantId: input.variantId, warehouseId: input.toWarehouseId },
        }));

      await tx.inventory.update({ where: { id: from.id }, data: { onHand: fromNext } });
      await tx.inventory.update({
        where: { id: to.id },
        data: { onHand: to.onHand + input.quantity },
      });
      await tx.inventoryMovement.createMany({
        data: [
          {
            variantId: input.variantId,
            warehouseId: input.fromWarehouseId,
            type: "TRANSFER_OUT",
            quantity: -input.quantity,
            previousOnHand: from.onHand,
            newOnHand: fromNext,
            reason: input.reason ?? "Warehouse transfer",
            referenceType: "TRANSFER",
            referenceId: input.toWarehouseId,
            actorId: input.actorId,
          },
          {
            variantId: input.variantId,
            warehouseId: input.toWarehouseId,
            type: "TRANSFER_IN",
            quantity: input.quantity,
            previousOnHand: to.onHand,
            newOnHand: to.onHand + input.quantity,
            reason: input.reason ?? "Warehouse transfer",
            referenceType: "TRANSFER",
            referenceId: input.fromWarehouseId,
            actorId: input.actorId,
          },
        ],
      });
      await this.audit.log({
        actorType: "STAFF",
        actorId: input.actorId,
        actorEmail: input.actorEmail,
        action: "inventory.transferred",
        entityType: "Inventory",
        entityId: input.variantId,
        after: { from: input.fromWarehouseId, to: input.toWarehouseId, quantity: input.quantity },
      });
      return { transferred: true };
    });
    await this.maybeLowStock(input.variantId, input.fromWarehouseId);
    return result;
  }

  async movements(variantId?: string, warehouseId?: string, take = 100) {
    return this.prisma.inventoryMovement.findMany({
      where: {
        ...(variantId ? { variantId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        variant: { select: { sku: true, size: true, color: true, product: { select: { name: true } } } },
        warehouse: { select: { name: true, code: true } },
      },
    });
  }

  async lowStock(limit = 50) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        variantId: string;
        warehouseId: string;
        sku: string;
        productName: string;
        size: string | null;
        color: string | null;
        onHand: number;
        reserved: number;
        damaged: number;
        available: number;
        reorderPoint: number;
        warehouse: string;
      }>
    >(Prisma.sql`
      SELECT i."variantId", i."warehouseId", v.sku, p.name AS "productName", v.size, v.color,
             i."onHand", i."reserved", i."damaged",
             (i."onHand" - i."reserved" - i."damaged") AS available,
             i."reorderPoint", w.name AS warehouse
      FROM "Inventory" i
      JOIN "Variant" v ON v.id = i."variantId"
      JOIN "Product" p ON p.id = v."productId"
      JOIN "Warehouse" w ON w.id = i."warehouseId"
      WHERE (i."onHand" - i."reserved" - i."damaged") <= i."reorderPoint"
        AND p.status = 'ACTIVE'
      ORDER BY available ASC
      LIMIT ${limit}
    `);
    return rows;
  }

  private async maybeLowStock(variantId: string, warehouseId: string) {
    try {
      const [inventory, variant] = await Promise.all([
        this.prisma.inventory.findUnique({
          where: { variantId_warehouseId: { variantId, warehouseId } },
          include: { warehouse: true },
        }),
        this.prisma.variant.findUnique({
          where: { id: variantId },
          include: { product: true },
        }),
      ]);
      if (!inventory || !variant) return;
      const available = inventory.onHand - inventory.reserved - inventory.damaged;
      if (available > inventory.reorderPoint) return;
      const staff = await this.prisma.user.findMany({
        where: {
          status: "ACTIVE",
          staffProfile: { role: { name: { in: ["SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER", "WAREHOUSE_STAFF"] } } },
        },
        select: { id: true },
      });
      const dedupe = `low-stock:${variantId}:${warehouseId}:${new Date().toISOString().slice(0, 10)}`;
      for (const member of staff) {
        await this.notifications.inApp({
          userId: member.id,
          template: "low-stock",
          subject: `Low stock: ${variant.product.name}`,
          body: `${variant.product.name} (${variant.sku}) has ${available} units available at ${inventory.warehouse.name}. Reorder point is ${inventory.reorderPoint}.`,
          dedupeKey: `${dedupe}:${member.id}`,
        });
      }
    } catch (error) {
      this.logger.warn(`Low stock notification failed: ${(error as Error).message}`);
    }
  }

  reservationWindowMinutes() {
    return COMMERCE.reservationMinutes;
  }

  /** Returns committed stock to sellable inventory after a paid order is cancelled. */
  async restockCancelledOrder(orderId: string, reason: string) {
    const already = await this.prisma.inventoryMovement.findFirst({
      where: { referenceType: "ORDER_CANCELLED", referenceId: orderId },
    });
    if (already) return { restocked: false, reason: "already_restocked" };
    const reservations = await this.prisma.stockReservation.findMany({
      where: { orderId, status: "COMMITTED" },
    });
    if (!reservations.length) return { restocked: false, reason: "nothing_to_restock" };
    await this.prisma.$transaction(async (tx) => {
      for (const reservation of reservations) {
        const inventory = await tx.inventory.findUnique({
          where: {
            variantId_warehouseId: {
              variantId: reservation.variantId,
              warehouseId: reservation.warehouseId,
            },
          },
        });
        if (!inventory) continue;
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { onHand: inventory.onHand + reservation.quantity },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: reservation.variantId,
            warehouseId: reservation.warehouseId,
            type: "RETURN",
            quantity: reservation.quantity,
            previousOnHand: inventory.onHand,
            newOnHand: inventory.onHand + reservation.quantity,
            reason,
            referenceType: "ORDER_CANCELLED",
            referenceId: orderId,
          },
        });
      }
    });
    return { restocked: true };
  }

  /** Restocks inspected return items to the default warehouse. Idempotent per return. */
  async restockReturn(
    returnRequestId: string,
    items: Array<{ variantId: string; quantity: number }>,
  ) {
    const already = await this.prisma.inventoryMovement.findFirst({
      where: { referenceType: "RETURN_REQUEST", referenceId: returnRequestId },
    });
    if (already) return { restocked: false, reason: "already_restocked" };
    const warehouse =
      (await this.prisma.warehouse.findFirst({ where: { isDefault: true, isActive: true } })) ??
      (await this.prisma.warehouse.findFirst({ where: { isActive: true } }));
    if (!warehouse) throw AppError.conflict("No active warehouse available for restocking.");

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        if (item.quantity <= 0) continue;
        const inventory =
          (await tx.inventory.findUnique({
            where: {
              variantId_warehouseId: { variantId: item.variantId, warehouseId: warehouse.id },
            },
          })) ??
          (await tx.inventory.create({
            data: { variantId: item.variantId, warehouseId: warehouse.id },
          }));
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { onHand: inventory.onHand + item.quantity },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            warehouseId: warehouse.id,
            type: "RETURN",
            quantity: item.quantity,
            previousOnHand: inventory.onHand,
            newOnHand: inventory.onHand + item.quantity,
            reason: "Returned item inspected and restocked",
            referenceType: "RETURN_REQUEST",
            referenceId: returnRequestId,
          },
        });
      }
    });
    return { restocked: true };
  }

  /** Deducts exchange replacement stock after inspection. */
  async fulfilExchange(
    returnRequestId: string,
    items: Array<{ variantId: string; quantity: number }>,
  ) {
    const already = await this.prisma.inventoryMovement.findFirst({
      where: { referenceType: "EXCHANGE", referenceId: returnRequestId },
    });
    if (already) return { fulfilled: false, reason: "already_fulfilled" };
    const warehouse =
      (await this.prisma.warehouse.findFirst({ where: { isDefault: true, isActive: true } })) ??
      (await this.prisma.warehouse.findFirst({ where: { isActive: true } }));
    if (!warehouse) throw AppError.conflict("No warehouse available for exchange fulfilment.");

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: {
            variantId_warehouseId: { variantId: item.variantId, warehouseId: warehouse.id },
          },
        });
        const available = inventory
          ? inventory.onHand - inventory.reserved - inventory.damaged
          : 0;
        if (!inventory || available < item.quantity) {
          throw AppError.conflict("Replacement size is no longer in stock.");
        }
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { onHand: inventory.onHand - item.quantity },
        });
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            warehouseId: warehouse.id,
            type: "SALE",
            quantity: -item.quantity,
            previousOnHand: inventory.onHand,
            newOnHand: inventory.onHand - item.quantity,
            reason: "Exchange replacement",
            referenceType: "EXCHANGE",
            referenceId: returnRequestId,
          },
        });
      }
    });
    return { fulfilled: true };
  }
}
