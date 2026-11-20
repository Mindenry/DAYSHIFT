import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { PageQuery } from "../../common/pagination";

export class OrderListQueryDto implements PageQuery {
  @IsOptional()
  @IsIn([
    "PENDING_PAYMENT", "PAID", "PROCESSING", "PICKING", "PACKED", "SHIPPED",
    "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED", "PAYMENT_FAILED", "CANCELLED",
    "ON_HOLD", "RETURN_REQUESTED", "PARTIALLY_RETURNED", "RETURNED", "REFUND_PENDING", "REFUNDED",
  ])
  status?: string;

  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) pageSize?: number;
}

export class ReturnListQueryDto implements PageQuery {
  @IsOptional()
  @IsIn([
    "REQUESTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "RETURN_SHIPPED",
    "RECEIVED", "INSPECTED", "REFUND_PENDING", "REFUNDED", "CLOSED", "CANCELLED",
  ])
  status?: string;

  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class GuestLookupDto {  @IsString() @MaxLength(40) orderNumber!: string;
  @IsEmail() @MaxLength(254) email!: string;
}

export class ReturnItemInputDto {
  @IsString() orderItemId!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10) quantity!: number;
  @IsOptional() @IsString() @MaxLength(300) conditionNotes?: string;
  @IsOptional() @IsString() exchangeVariantId?: string;
}

export class CreateReturnDto {
  @IsString() orderId!: string;
  @IsIn(["REFUND", "EXCHANGE", "STORE_CREDIT"]) resolution!: "REFUND" | "EXCHANGE" | "STORE_CREDIT";
  @IsIn(["DOES_NOT_FIT", "WRONG_SIZE", "WRONG_COLOR", "NOT_AS_DESCRIBED", "DAMAGED", "DEFECTIVE", "CHANGED_MIND", "OTHER"])
  reason!: string;
  @IsOptional() @IsString() @MaxLength(1000) customerNote?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items!: ReturnItemInputDto[];
}

export class CancelOrderDto {
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

export class UpdateOrderStatusDto {
  @IsString() status!: string;
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

export class CreateShipmentDto {
  @IsString() @MaxLength(80) carrier!: string;
  @IsString() @MaxLength(80) service!: string;
  @IsOptional() @IsString() @MaxLength(80) trackingNumber?: string;
  @IsOptional() @IsString() estimatedDelivery?: string;
}

export class ShipmentEventDto {
  @IsString() status!: string;
  @IsString() @MaxLength(300) description!: string;
  @IsOptional() @IsString() @MaxLength(120) location?: string;
}

export class UpdateReturnDto {
  @IsIn([
    "UNDER_REVIEW", "APPROVED", "REJECTED", "RETURN_SHIPPED", "RECEIVED",
    "INSPECTED", "REFUND_PENDING", "REFUNDED", "CLOSED", "CANCELLED",
  ])
  status!: string;
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
  @IsOptional() @IsString() @MaxLength(500) message?: string;
}
