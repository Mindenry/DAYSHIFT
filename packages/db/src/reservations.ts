import { PrismaClient } from "@prisma/client";

/**
 * Releases expired stock reservations and cancels orders still awaiting
 * payment. Shared by the API (manual trigger) and the background worker so the
 * inventory invariant has exactly one implementation.
 */
export async function expireStaleReservations(prisma: PrismaClient): Promise<number> {
  const expired = await prisma.stockReservation.findMany({
    where: { status: "ACTIVE", expiresAt: { lt: new Date() } },
    select: { orderId: true },
  });
  const orderIds = Array.from(
    new Set(expired.map((row) => row.orderId).filter((id): id is string => !!id)),
  );
  if (!orderIds.length) return 0;

  let released = 0;
  for (const orderId of orderIds) {
    try {
      await prisma.$transaction(async (tx) => {
        const reservations = await tx.stockReservation.findMany({
          where: { orderId, status: "ACTIVE", expiresAt: { lt: new Date() } },
        });
        if (!reservations.length) return;
        for (const reservation of reservations) {
          await tx.$executeRaw`
            UPDATE "Inventory"
            SET "reserved" = GREATEST(0, "reserved" - ${reservation.quantity}), "updatedAt" = NOW()
            WHERE "variantId" = ${reservation.variantId}
              AND "warehouseId" = ${reservation.warehouseId}
          `;
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { status: "EXPIRED", releasedAt: new Date() },
          });
          released += 1;
        }
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (order && order.status === "PENDING_PAYMENT") {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED", paymentStatus: "CANCELLED", cancelledAt: new Date() },
          });
          await tx.payment.updateMany({
            where: { orderId, status: "PENDING" },
            data: { status: "CANCELLED" },
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: "PENDING_PAYMENT",
              toStatus: "CANCELLED",
              actorType: "SYSTEM",
              reason: "Stock reservation expired before payment",
            },
          });
        }
      });
    } catch {
      // One failed order must not block releasing the rest; the next run retries.
    }
  }
  return released;
}
