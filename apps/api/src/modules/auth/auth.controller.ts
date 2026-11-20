import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService, RequestMeta } from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyEmailDto,
} from "./auth.dto";
import { CurrentUser, Public } from "../../common/decorators";
import { AuthUser, SESSION_COOKIE } from "../../common/types";
import { AppError } from "../../common/app-error";
import { secureCookies } from "../../common/cookies";

const COOKIE_MAX_AGE = 30 * 86_400_000;

function meta(req: Request): RequestMeta {
  return { ip: req.ip, userAgent: req.header("user-agent") };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("register")
  @ApiOperation({ summary: "Create a customer account" })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.register(dto, meta(req));
    setSessionCookie(res, token);
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("login")
  @ApiOperation({ summary: "Sign in as a customer or staff member" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(dto, meta(req));
    setSessionCookie(res, token);
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("staff/login")
  @ApiOperation({ summary: "Sign in to the administration portal" })
  async staffLogin(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.staffLogin(dto, meta(req));
    setSessionCookie(res, token);
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  @ApiCookieAuth("ds_session")
  @ApiOperation({ summary: "Revoke the current session" })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { loggedOut: true };
  }

  @Get("me")
  @ApiCookieAuth("ds_session")
  async me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch("profile")
  @ApiCookieAuth("ds_session")
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @Post("change-password")
  @HttpCode(200)
  @ApiCookieAuth("ds_session")
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto, user.sessionId);
  }

  @Get("sessions")
  @ApiCookieAuth("ds_session")
  async sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user.id, user.sessionId);
  }

  @Delete("sessions/:id")
  @ApiCookieAuth("ds_session")
  async revokeSession(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.auth.revokeSession(user.id, id);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(200)
  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password reset link (always returns sent)" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("verify-email")
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post("verify-email/resend")
  @HttpCode(200)
  @ApiCookieAuth("ds_session")
  async resendVerification(@CurrentUser() user: AuthUser, @Req() req: Request) {
    const full = await this.auth.me(user.id);
    if (full.emailVerifiedAt) throw AppError.validation("Your email is already verified.");
    return this.auth.sendVerification(user.id, user.email, user.firstName);
  }

  @Get("staff/authorize")
  @ApiCookieAuth("ds_session")
  @ApiOperation({ summary: "Assert that the current session belongs to active staff" })
  async authorizeStaff(@CurrentUser() user: AuthUser) {
    if (user.kind !== "staff") throw new UnauthorizedException("Staff access required");
    return { authorized: true, role: user.staffRole, permissions: user.permissions };
  }
}
