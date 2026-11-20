import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { CartService } from "./cart.service";
import { AddCartItemDto, ApplyCouponDto, UpdateCartItemDto } from "./cart.dto";
import { CurrentUser, Public } from "../../common/decorators";
import { AuthUser, CART_COOKIE } from "../../common/types";
import { AppError } from "../../common/app-error";

const CART_MAX_AGE = 90 * 86_400_000;

@ApiTags("cart")
@Public()
@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private context(req: Request, user?: AuthUser) {
    return { user, guestToken: req.cookies?.[CART_COOKIE] as string | undefined };
  }

  private finish(
    result: { cart: Record<string, unknown>; issuedGuestToken?: string; merged?: boolean },
    res: Response,
  ) {
    if (result.issuedGuestToken) {
      res.cookie(CART_COOKIE, result.issuedGuestToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: CART_MAX_AGE,
      });
    }
    if (result.merged) {
      res.clearCookie(CART_COOKIE, { path: "/" });
    }
    return result.cart;
  }

  @Get()
  async get(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(await this.cartService.get(this.context(req, user)), res);
  }

  @Post("items")
  async add(
    @Body() dto: AddCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(
      await this.cartService.addItem(this.context(req, user), dto.variantId, dto.quantity),
      res,
    );
  }

  @Patch("items/:id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(
      await this.cartService.updateItem(this.context(req, user), id, dto.quantity),
      res,
    );
  }

  @Delete("items/:id")
  async remove(
    @Param("id") id: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(await this.cartService.removeItem(this.context(req, user), id), res);
  }

  @Delete()
  async clear(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(await this.cartService.clear(this.context(req, user)), res);
  }

  @Post("coupon")
  @ApiCookieAuth("ds_session")
  async applyCoupon(
    @Body() dto: ApplyCouponDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(
      await this.cartService.applyCoupon(this.context(req, user), dto.code),
      res,
    );
  }

  @Delete("coupon")
  async removeCoupon(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.finish(await this.cartService.removeCoupon(this.context(req, user)), res);
  }

  @Post("merge")
  @ApiCookieAuth("ds_session")
  async merge(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    if (!user) throw AppError.unauthorized();
    const guestToken = req.cookies?.[CART_COOKIE] as string | undefined;
    if (!guestToken) return this.cartService.get({ user }).then((r) => this.finish(r, res));
    return this.finish(await this.cartService.mergeGuestCart(user, guestToken), res);
  }
}
