import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Prisma } from "@dayshift/db";
import { PrismaService } from "../../prisma/prisma.module";
import { InventoryService } from "../inventory/inventory.service";
import { OrdersService } from "../orders/orders.service";
import { AuditService } from "../audit/audit.service";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser, RequirePermissions } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { getPaging, paged } from "../../common/pagination";
import { AppError } from "../../common/app-error";
import {
  AdjustStockDto,
  CreatePurchaseOrderDto,
  InventoryQueryDto,
  OrderNoteDto,
  OrderStatusDto,
  PurchaseOrderItemDto,
  SupplierInputDto,
  TransferStockDto,
  WarehouseInputDto,
} from "./admin-operations.dto";
import {
  CreateShipmentDto,
  OrderListQueryDto,
  ReturnListQueryDto,
  ShipmentEventDto,
  UpdateReturnDto,
} from "../orders/orders.dto";

function actor(user: AuthUser) {
  return { id: user.id, email: user.email };
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/inventory")
export class AdminInventoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  @Get()
  @RequirePermissions("inventory.read")
  async list(@Query() query: InventoryQueryDto) {
    const { page, pageSize, skip, take } = getPaging(query, 25, 100);
    let where = Prisma.sql`WHERE 1=1`;
    if (query.q) {
      const term = `%${query.q}%`;
      where = Prisma.sql`${where} AND (v.sku ILIKE ${term} OR p.name ILIKE ${term} OR v.color ILIKE ${term})`;
    }
    if (query.warehouseId) where = Prisma.sql`${where} AND i."warehouseId" = ${query.warehouseId}`;
    if (query.lowStock === "true") {
      where = Prisma.sql`${where} AND (i."onHand" - i."reserved" - i."damaged") <= i."reorderPoint"`;
    }
    const rows = await this.prisma.$queryRaw<
      Array<{
        variantId: string;
        warehouseId: string;
        sku: string;
        productId: string;
        productName: string;
        size: string | null;
        color: string | null;
        onHand: number;
        reserved: number;
        damaged: number;
        incoming: number;
        safetyStock: number;
        reorderPoint: number;
        available: number;
        warehouseName: string;
        warehouseCode: string;
      }>
    >(Prisma.sql`
      SELECT i."variantId", i."warehouseId", v.sku, p.id AS "productId", p.name AS "productName",
             v.size, v.color, i."onHand", i."reserved", i."damaged", i."incoming",
             i."safetyStock", i."reorderPoint",
             (i."onHand" - i."reserved" - i."damaged") AS available,
             w.name AS "warehouseName", w.code AS "warehouseCode"
      FROM "Inventory" i
      JOIN "Variant" v ON v.id = i."variantId"
      JOIN "Product" p ON p.id = v."productId"
      JOIN "Warehouse" w ON w.id = i."warehouseId"
      ${where}
      ORDER BY available ASC, p.name ASC
      LIMIT ${take} OFFSET ${skip}
    `);
    const count = await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM "Inventory" i
      JOIN "Variant" v ON v.id = i."variantId"
      JOIN "Product" p ON p.id = v."productId"
      ${where}
    `);
    return paged(rows, Number(count[0]?.count ?? 0), page, pageSize);
  }

  @Get("movements")
  @RequirePermissions("inventory.read")
  movements(@Query("variantId") variantId?: string, @Query("warehouseId") warehouseId?: string) {
    return this.inventory.movements(variantId, warehouseId, 200);
  }

  @Get("low-stock")
  @RequirePermissions("inventory.read")
  lowStock() {
    return this.inventory.lowStock(100);
  }

  @Post("adjust")
  @RequirePermissions("inventory.adjust")
  adjust(@CurrentUser() user: AuthUser, @Body() dto: AdjustStockDto) {
    return this.inventory.adjust({
      variantId: dto.variantId,
      warehouseId: dto.warehouseId,
      quantityDelta: dto.quantityDelta,
      reason: dto.reason,
      type: dto.type as never,
      actorId: user.id,
      actorEmail: user.email,
    });
  }

  @Post("transfer")
  @RequirePermissions("inventory.transfer")
  transfer(@CurrentUser() user: AuthUser, @Body() dto: TransferStockDto) {
    return this.inventory.transfer({
      variantId: dto.variantId,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      quantity: dto.quantity,
      reason: dto.reason,
      actorId: user.id,
      actorEmail: user.email,
    });
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/warehouses")
export class AdminWarehouseController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("inventory.read")
  list() {
    return this.prisma.warehouse.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: { _count: { select: { inventory: true } } },
    });
  }

  @Post()
  @RequirePermissions("warehouses.manage")
  async create(@CurrentUser() user: AuthUser, @Body() dto: WarehouseInputDto) {
    if (dto.isDefault) await this.prisma.warehouse.updateMany({ data: { isDefault: false } });
    const warehouse = await this.prisma.warehouse.create({
      data: { ...dto, country: dto.country.toUpperCase(), isActive: dto.isActive ?? true, isDefault: dto.isDefault ?? false },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "warehouse.created",
      entityType: "Warehouse",
      entityId: warehouse.id,
      after: { name: warehouse.name },
    });
    return warehouse;
  }

  @Patch(":id")
  @RequirePermissions("warehouses.manage")
  async update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: Partial<WarehouseInputDto>) {
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({ data: { isDefault: false } });
    }
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: { ...dto, ...(dto.country ? { country: dto.country.toUpperCase() } : {}) },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "warehouse.updated",
      entityType: "Warehouse",
      entityId: id,
      after: dto,
    });
    return warehouse;
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/suppliers")
export class AdminSupplierController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("suppliers.manage")
  list() {
    return this.prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { purchaseOrders: true } } },
    });
  }

  @Post()
  @RequirePermissions("suppliers.manage")
  create(@Body() dto: SupplierInputDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  @Patch(":id")
  @RequirePermissions("suppliers.manage")
  update(@Param("id") id: string, @Body() dto: Partial<SupplierInputDto>) {
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/purchase-orders")
export class AdminPurchaseOrderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("purchase_orders.manage")
  list() {
    return this.prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        supplier: { select: { name: true } },
        warehouse: { select: { name: true, code: true } },
        items: { include: { variant: { select: { sku: true, size: true, color: true } } } },
      },
    });
  }

  @Post()
  @RequirePermissions("purchase_orders.manage")
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreatePurchaseOrderDto) {
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const count = await this.prisma.purchaseOrder.count();
    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        status: dto.status,
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : null,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        notes: dto.notes,
        createdById: user.id,
        items: {
          create: dto.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitCost),
          })),
        },
      },
    });
    return po;
  }

  @Post(":id/receive")
  @RequirePermissions("purchase_orders.manage")
  async receive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
    if (!po) throw AppError.notFound("Purchase order not found");
    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      throw AppError.conflict("This purchase order cannot be received.");
    }
    for (const item of po.items) {
      await this.inventory.adjust({
        variantId: item.variantId,
        warehouseId: po.warehouseId,
        quantityDelta: item.quantity,
        reason: `Purchase order ${po.poNumber} received`,
        type: "STOCK_IN",
        actorId: user.id,
        actorEmail: user.email,
      });
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.id },
        data: { receivedQuantity: item.quantity },
      });
    }
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "purchase_order.received",
      entityType: "PurchaseOrder",
      entityId: id,
      after: { poNumber: po.poNumber },
    });
    return updated;
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("orders.read")
  list(@Query() query: OrderListQueryDto) {
    return this.orders.adminList(query);
  }

  @Get("payments")
  @RequirePermissions("payments.read")
  async payments() {
    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { orderNumber: true, email: true, status: true } } },
    });
    return payments.map((payment) => ({
      id: payment.id,
      orderNumber: payment.order.orderNumber,
      email: payment.order.email,
      method: payment.method,
      status: payment.status,
      amount: payment.amount.toString(),
      provider: payment.provider,
      reference: payment.providerRef,
      createdAt: payment.createdAt,
    }));
  }

  @Get("refunds")
  @RequirePermissions("refunds.read")
  async refunds() {
    const refunds = await this.prisma.refund.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { orderNumber: true, email: true } } },
    });
    return refunds.map((refund) => ({
      id: refund.id,
      orderNumber: refund.order.orderNumber,
      email: refund.order.email,
      amount: refund.amount.toString(),
      reason: refund.reason,
      status: refund.status,
      createdAt: refund.createdAt,
    }));
  }

  @Get(":orderNumber")
  @RequirePermissions("orders.read")
  detail(@Param("orderNumber") orderNumber: string) {
    return this.orders.adminDetail(orderNumber);
  }

  @Patch(":orderNumber/status")
  @RequirePermissions("orders.update")
  async status(
    @CurrentUser() user: AuthUser,
    @Param("orderNumber") orderNumber: string,
    @Body() dto: OrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!order) throw AppError.notFound("Order not found");
    return this.orders.updateStatus(order.id, dto.status, actor(user), dto.reason);
  }

  @Patch(":orderNumber/notes")
  @RequirePermissions("orders.update")
  async notes(
    @CurrentUser() user: AuthUser,
    @Param("orderNumber") orderNumber: string,
    @Body() dto: OrderNoteDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw AppError.notFound("Order not found");
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { internalNotes: dto.notes },
    });
    await this.audit.log({
      actorType: "STAFF",
      actorId: user.id,
      actorEmail: user.email,
      action: "order.notes_updated",
      entityType: "Order",
      entityId: order.id,
      before: { notes: order.internalNotes },
      after: { notes: dto.notes },
    });
    return { internalNotes: updated.internalNotes };
  }

  @Post(":orderNumber/cancel")
  @RequirePermissions("orders.cancel")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param("orderNumber") orderNumber: string,
    @Body() body: { reason?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: true,
        refunds: true,
        statusHistory: true,
        shipments: { include: { events: true } },
        returnRequests: { include: { items: true } },
      },
    });
    if (!order) throw AppError.notFound("Order not found");
    return this.orders.cancelOrder(
      order as never,
      { id: user.id, email: user.email, type: "STAFF" },
      body.reason,
    );
  }

  @Post(":orderNumber/shipments")
  @RequirePermissions("shipments.manage")
  async createShipment(
    @CurrentUser() user: AuthUser,
    @Param("orderNumber") orderNumber: string,
    @Body() dto: CreateShipmentDto,
  ) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, select: { id: true } });
    if (!order) throw AppError.notFound("Order not found");
    return this.orders.createShipment(order.id, dto, actor(user));
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/shipments")
export class AdminShipmentsController {
  constructor(private readonly orders: OrdersService) {}

  @Patch(":id/status")
  @RequirePermissions("shipments.manage")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ShipmentEventDto) {
    return this.orders.updateShipment(id, dto, actor(user));
  }
}

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/returns")
export class AdminReturnsController {
  constructor(
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermissions("returns.read")
  list(@Query() query: ReturnListQueryDto) {
    return this.orders.adminReturns(query);
  }

  @Get(":id")
  @RequirePermissions("returns.read")
  detail(@Param("id") id: string) {
    return this.orders.returnDetail(id);
  }

  @Patch(":id/status")
  @RequirePermissions("returns.manage")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateReturnDto) {
    return this.orders.updateReturnStatus(id, dto, actor(user));
  }

  @Post(":id/refund")
  @RequirePermissions("refunds.create")
  async refund(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const request = await this.prisma.returnRequest.findUnique({ where: { id }, select: { id: true } });
    if (!request) throw AppError.notFound("Return not found");
    return this.orders.refundReturn(id, actor(user));
  }
}
