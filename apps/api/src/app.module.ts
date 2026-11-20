import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { join } from "node:path";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { CheckoutModule } from "./modules/checkout/checkout.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AccountModule } from "./modules/account/account.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module";
import { SupportModule } from "./modules/support/support.module";
import { ContentModule } from "./modules/content/content.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AuditModule } from "./modules/audit/audit.module";
import { SessionAuthGuard } from "./common/guards/session-auth.guard";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { PricingModule } from "./modules/pricing/pricing.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), ".env"), join(process.cwd(), "../../.env")],
    }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
      },
    ]),
    PrismaModule,
    RedisModule,
    QueueModule,
    NotificationsModule,
    AuditModule,
    PricingModule,
    AuthModule,
    CatalogModule,
    CartModule,
    WishlistModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    AccountModule,
    InventoryModule,
    ReviewsModule,
    LoyaltyModule,
    SupportModule,
    ContentModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
