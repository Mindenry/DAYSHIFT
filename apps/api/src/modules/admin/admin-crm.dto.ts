import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CustomerQueryDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsString() segment?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() @MaxLength(2000) staffNotes?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() @MaxLength(40) segment?: string;
  @IsOptional() @IsIn(["ACTIVE", "SUSPENDED"]) status?: "ACTIVE" | "SUSPENDED";
}

export class TicketQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class TicketReplyDto {
  @IsString() @MinLength(1) @MaxLength(4000) body!: string;
  @IsOptional() @IsBoolean() internal?: boolean;
}

export class TicketUpdateDto {
  @IsOptional() @IsIn(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL_TEAM", "RESOLVED", "CLOSED"]) status?: string;
  @IsOptional() @IsIn(["LOW", "NORMAL", "HIGH", "URGENT"]) priority?: string;
  @IsOptional() @IsString() assignedToId?: string | null;
}

export class CouponInputDto {
  @IsString() @MinLength(2) @MaxLength(40) code!: string;
  @IsOptional() @IsString() @MaxLength(200) description?: string;
  @IsIn(["PERCENTAGE", "FIXED"]) type!: "PERCENTAGE" | "FIXED";
  @Type(() => Number) @IsNumber() @Min(0) value!: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minOrderSubtotal?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxDiscount?: number;
  @IsString() startsAt!: string;
  @IsString() endsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) usageLimitTotal?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) usageLimitPerCustomer?: number;
  @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @IsOptional() @IsBoolean() stackable?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() collectionIds?: string[];
  @IsOptional() @IsArray() categoryIds?: string[];
  @IsOptional() @IsArray() productIds?: string[];
}

export class PromotionInputDto {
  @IsString() @MinLength(2) @MaxLength(140) name!: string;
  @IsOptional() @IsString() @MaxLength(300) description?: string;
  @IsIn(["PERCENTAGE", "FIXED"]) type!: "PERCENTAGE" | "FIXED";
  @Type(() => Number) @IsNumber() @Min(0) value!: number;
  @IsIn(["ALL", "CATEGORY", "PRODUCT", "COLLECTION"]) scope!: "ALL" | "CATEGORY" | "PRODUCT" | "COLLECTION";
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() collectionId?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minSubtotal?: number;
  @IsString() startsAt!: string;
  @IsString() endsAt!: string;
  @IsOptional() @Type(() => Number) @IsInt() priority?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReviewModerationDto {
  @IsIn(["PENDING", "APPROVED", "REJECTED"]) status!: "PENDING" | "APPROVED" | "REJECTED";
}

export class LoyaltyAdjustDto {
  @Type(() => Number) @IsInt() points!: number;
  @IsString() @MinLength(3) @MaxLength(200) reason!: string;
}

export class ContentBlockInputDto {
  @IsString() @MinLength(2) @MaxLength(80) key!: string;
  @IsOptional() @IsString() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @MaxLength(160) subtitle?: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsOptional() @IsString() @MaxLength(80) ctaLabel?: string;
  @IsOptional() @IsString() @MaxLength(300) ctaUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() position?: number;
  @IsOptional() @IsIn(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]) status?: string;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsString() endsAt?: string;
}
