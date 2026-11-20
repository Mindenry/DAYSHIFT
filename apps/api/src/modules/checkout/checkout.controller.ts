import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CheckoutService } from "./checkout.service";
import { CheckoutDto, QuoteDto } from "./checkout.dto";
import { CurrentUser, Public } from "../../common/decorators";
import { AuthUser, CART_COOKIE } from "../../common/types";
import { PrismaService } from "../../prisma/prisma.module";

@ApiTags("checkout")
@Public()
@Controller("checkout")
export class CheckoutController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly prisma: PrismaService,
  ) {}

  private context(req: Request, user?: AuthUser) {
    return { user, guestToken: req.cookies?.[CART_COOKIE] as string | undefined };
  }

  @Get("config")
  async config() {
    const setting = await this.prisma.setting.findUnique({ where: { key: "payments" } });
    const returns = await this.prisma.setting.findUnique({ where: { key: "returns" } });
    return {
      paymentMethods: [
        { code: "SANDBOX_CARD", label: "Card (sandbox)", enabled: true, simulated: true },
        {
          code: "CASH_ON_DELIVERY",
          label: "Cash on delivery",
          enabled: (setting?.value as { cashOnDelivery?: boolean } | null)?.cashOnDelivery === true,
          simulated: false,
        },
      ],
      returnWindowDays: (returns?.value as { windowDays?: number } | null)?.windowDays ?? 30,
    };
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post("quote")
  quote(
    @Req() req: Request,
    @Body() dto: QuoteDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.checkout.quote(this.context(req, user), dto);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post()
  create(
    @Req() req: Request,
    @Body() dto: CheckoutDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.checkout.checkout(this.context(req, user), dto);
  }
}
