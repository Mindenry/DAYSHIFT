import { Injectable } from "@nestjs/common";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { parseDateRange } from "../../common/pagination";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async metrics(from?: string, to?: string) {
    const range = parseDateRange(from, to);
    if (!range) throw new Error("Invalid date range");
    const { start, end } = range;
    const paidStatuses = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

    const [salesAgg, orderCount, refundAgg, newCustomers, pendingOrders, pendingReturns, recentOrders, customers] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: {
            paymentStatus: { in: paidStatuses as never[] },
            placedAt: { gte: start, lte: end },
          },
          _sum: { grandTotal: true },
          _count: { id: true },
        }),
        this.prisma.order.count({ where: { placedAt: { gte: start, lte: end } } }),
        this.prisma.refund.aggregate({
          where: { status: "PROCESSED", processedAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.user.count({
          where: { createdAt: { gte: start, lte: end }, customerProfile: { isNot: null } },
        }),
        this.prisma.order.count({
          where: { status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING", "PICKING", "PACKED"] } },
        }),
        this.prisma.returnRequest.count({
          where: { status: { in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "RETURN_SHIPPED", "RECEIVED", "INSPECTED", "REFUND_PENDING"] } },
        }),
        this.prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            orderNumber: true,
            email: true,
            status: true,
            paymentStatus: true,
            grandTotal: true,
            createdAt: true,
          },
        }),
        this.prisma.order.count({
          where: { paymentStatus: { in: paidStatuses as never[] }, placedAt: { gte: start, lte: end } },
        }),
      ]);

    const units = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          paymentStatus: { in: paidStatuses as never[] },
          placedAt: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true },
    });

    const gross = Number(salesAgg._sum.grandTotal ?? 0);
    const refunds = Number(refundAgg._sum.amount ?? 0);
    const lowStockRows = await this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count FROM "Inventory" i
      JOIN "Product" p ON p.id = (SELECT "productId" FROM "Variant" WHERE id = i."variantId")
      WHERE p.status = 'ACTIVE' AND (i."onHand" - i."reserved" - i."damaged") <= i."reorderPoint"
    `);

    const series = await this.prisma.$queryRaw<Array<{ day: Date; total: string; orders: bigint }>>(Prisma.sql`
      SELECT date_trunc('day', "placedAt") AS day,
             COALESCE(SUM("grandTotal"), 0)::text AS total,
             COUNT(*)::bigint AS orders
      FROM "Order"
      WHERE "placedAt" >= ${start} AND "placedAt" <= ${end}
        AND "paymentStatus"::text IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')
      GROUP BY 1 ORDER BY 1 ASC
    `);

    const topProducts = await this.prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        productId: { not: null },
        order: {
          paymentStatus: { in: paidStatuses as never[] },
          placedAt: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 6,
    });

    const categories = await this.prisma.$queryRaw<
      Array<{ name: string; units: bigint; revenue: string }>
    >(Prisma.sql`
      SELECT c.name, SUM(oi.quantity)::bigint AS units, SUM(oi."lineTotal")::text AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      JOIN "ProductCategory" pc ON pc."productId" = oi."productId" AND pc."isPrimary" = true
      JOIN "Category" c ON c.id = pc."categoryId"
      WHERE o."placedAt" >= ${start} AND o."placedAt" <= ${end}
        AND o."paymentStatus"::text IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')
      GROUP BY c.name
      ORDER BY units DESC
      LIMIT 6
    `);

    return {
      range: { from: start, to: end },
      grossSales: gross.toFixed(2),
      netSales: (gross - refunds).toFixed(2),
      refunds: refunds.toFixed(2),
      orders: orderCount,
      paidOrders: salesAgg._count.id,
      averageOrderValue: customers > 0 ? (gross / customers).toFixed(2) : "0.00",
      unitsSold: units._sum.quantity ?? 0,
      newCustomers,
      lowStockVariants: Number(lowStockRows[0]?.count ?? 0),
      pendingOrders,
      pendingReturns,
      salesSeries: series.map((row) => ({
        day: row.day,
        total: Number(row.total).toFixed(2),
        orders: Number(row.orders),
      })),
      topProducts: topProducts.map((row) => ({
        productId: row.productId,
        name: row.productName,
        units: row._sum.quantity ?? 0,
        revenue: Number(row._sum.lineTotal ?? 0).toFixed(2),
      })),
      topCategories: categories.map((row) => ({
        name: row.name,
        units: Number(row.units),
        revenue: Number(row.revenue).toFixed(2),
      })),
      recentOrders: recentOrders.map((order) => ({
        ...order,
        grandTotal: order.grandTotal.toString(),
      })),
      // Conversion metrics require an analytics/traffic provider; this demo
      // intentionally does not fabricate them.
      conversion: null,
    };
  }
}
