import { Module } from "@nestjs/common";
import { AdminCatalogController } from "./admin-catalog.controller";
import { AdminCatalogService } from "./admin-catalog.service";
import { AdminDashboardController } from "./admin-system.controller";
import {
  AdminAuditController,
  AdminReportsController,
  AdminRolesController,
  AdminSettingsController,
  AdminStaffController,
  AdminSystemController,
} from "./admin-system.controller";
import { AdminDashboardService } from "./admin-dashboard.service";
import {
  AdminInventoryController,
  AdminOrdersController,
  AdminPurchaseOrderController,
  AdminReturnsController,
  AdminShipmentsController,
  AdminSupplierController,
  AdminWarehouseController,
} from "./admin-operations.controller";
import {
  AdminContentController,
  AdminCouponsController,
  AdminCustomersController,
  AdminLoyaltyController,
  AdminPromotionsController,
  AdminReviewsController,
  AdminTicketsController,
} from "./admin-crm.controller";
import { OrdersModule } from "../orders/orders.module";
import { InventoryModule } from "../inventory/inventory.module";
import { SupportModule } from "../support/support.module";

@Module({
  imports: [OrdersModule, InventoryModule, SupportModule],
  controllers: [
    AdminDashboardController,
    AdminCatalogController,
    AdminInventoryController,
    AdminWarehouseController,
    AdminSupplierController,
    AdminPurchaseOrderController,
    AdminOrdersController,
    AdminShipmentsController,
    AdminReturnsController,
    AdminCustomersController,
    AdminTicketsController,
    AdminReviewsController,
    AdminCouponsController,
    AdminPromotionsController,
    AdminLoyaltyController,
    AdminContentController,
    AdminStaffController,
    AdminRolesController,
    AdminAuditController,
    AdminSettingsController,
    AdminReportsController,
    AdminSystemController,
  ],
  providers: [AdminDashboardService, AdminCatalogService],
})
export class AdminModule {}
