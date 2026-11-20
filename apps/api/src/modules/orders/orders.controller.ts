import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { OrdersService } from "./orders.service";
import {
  CancelOrderDto,
  CreateReturnDto,
  GuestLookupDto,
  OrderListQueryDto,
} from "./orders.dto";
import { CurrentUser, Public } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { AppError } from "../../common/app-error";

@ApiTags("orders")
@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get("orders")
  @ApiCookieAuth("ds_session")
  list(@CurrentUser() user: AuthUser, @Query() query: OrderListQueryDto) {
    return this.orders.listForUser(user, query);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("orders/lookup")
  lookup(@Body() dto: GuestLookupDto) {
    return this.orders.guestLookup(dto);
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get("orders/track")
  track(@Query("orderNumber") orderNumber: string, @Query("email") email: string) {
    if (!orderNumber || !email) throw AppError.validation("Order number and email are required.");
    return this.orders.shipmentTracking(orderNumber, undefined, email);
  }

  @Get("orders/:orderNumber")
  @ApiCookieAuth("ds_session")
  detail(@CurrentUser() user: AuthUser, @Param("orderNumber") orderNumber: string) {
    return this.orders.detailForUser(user, orderNumber);
  }

  @Post("orders/:orderNumber/cancel")
  @ApiCookieAuth("ds_session")
  cancel(
    @CurrentUser() user: AuthUser,
    @Param("orderNumber") orderNumber: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.orders.cancelForUser(user, orderNumber, dto);
  }

  @Post("orders/:orderNumber/reorder")
  @ApiCookieAuth("ds_session")
  reorder(@CurrentUser() user: AuthUser, @Param("orderNumber") orderNumber: string) {
    return this.orders.reorder(user, orderNumber);
  }

  @Get("returns")
  @ApiCookieAuth("ds_session")
  returns(@CurrentUser() user: AuthUser) {
    return this.orders.returnsForUser(user.id);
  }

  @Post("returns")
  @ApiCookieAuth("ds_session")
  createReturn(@CurrentUser() user: AuthUser, @Body() dto: CreateReturnDto) {
    return this.orders.createReturn(user, dto);
  }

  @Get("returns/:id")
  @ApiCookieAuth("ds_session")
  returnDetail(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.orders.returnForUser(user.id, id);
  }
}
