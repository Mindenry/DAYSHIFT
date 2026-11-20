import { Body, Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";
import { PaymentsService } from "./payments.service";
import { PrismaService } from "../../prisma/prisma.module";
import { CurrentUser, Public } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import { AppError } from "../../common/app-error";
import { constantTimeEqual, hmacSha256, randomToken } from "../../common/crypto";

class SandboxConfirmDto {
  @IsString() @MinLength(6) reference!: string;
  @IsIn(["success", "failure"]) outcome!: "success" | "failure";
  @IsOptional() @IsEmail() email?: string;
}

class WebhookEventDto {
  @IsString() eventId!: string;
  @IsIn(["payment.succeeded", "payment.failed"]) type!: "payment.succeeded" | "payment.failed";
  @IsString() reference!: string;
  @Type(() => Number) @IsInt() @Min(1) amountCents!: number;
  @IsOptional() @IsString() currency?: string;
}

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Simulates the hosted checkout result. A real provider would redirect back. */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post("sandbox/confirm")
  async confirm(
    @Body() dto: SandboxConfirmDto,
    @CurrentUser() user?: AuthUser,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerRef: dto.reference },
      include: { order: true },
    });
    if (!payment) throw AppError.notFound("Payment not found");
    if (payment.provider !== "sandbox") {
      throw AppError.validation("This payment is not a sandbox payment.");
    }
    if (payment.order.userId) {
      if (!user || user.id !== payment.order.userId) {
        throw AppError.forbidden("This payment belongs to another customer.");
      }
    } else {
      if (!dto.email || dto.email.trim().toLowerCase() !== payment.order.email.toLowerCase()) {
        throw AppError.forbidden("Confirm the email address used for this order.");
      }
    }
    if (payment.status === "PAID") {
      return { processing: false, alreadyPaid: true };
    }

    const eventId = `sbx_evt_${randomToken(12)}`;
    await this.payments.processSandboxEvent({
      eventId,
      type: dto.outcome === "success" ? "payment.succeeded" : "payment.failed",
      reference: payment.providerRef,
      amountCents: Math.round(Number(payment.amount.toString()) * 100),
      currency: payment.currency,
    });
    const order = await this.prisma.order.findUnique({
      where: { id: payment.orderId },
      select: { status: true, paymentStatus: true, orderNumber: true },
    });
    return { processing: true, order };
  }

  /**
   * Sandbox provider webhook. Verifies HMAC over the raw request body and is
   * idempotent by eventId, so replaying the same event cannot deduct stock or
   * award loyalty points twice.
   */
  @Public()
  @HttpCode(200)
  @Post("webhooks/sandbox")
  async webhook(
    @Req() req: Request & { rawBody?: string },
    @Headers("x-dayshift-signature") signature: string | undefined,
    @Body() body: WebhookEventDto,
  ) {
    if (!signature) throw AppError.unauthorized("Missing webhook signature");
    const raw = req.rawBody ?? JSON.stringify(body);
    const expected = hmacSha256(raw, this.payments.sandboxSecret());
    if (!constantTimeEqual(signature, expected)) {
      throw AppError.unauthorized("Invalid webhook signature");
    }
    const amountCents = Number(body.amountCents);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      throw AppError.validation("Invalid amount");
    }
    const result = await this.payments.processSandboxEvent({
      eventId: body.eventId,
      type: body.type,
      reference: body.reference,
      amountCents,
      currency: body.currency ?? "USD",
    });
    return { received: true, ...result };
  }
}
