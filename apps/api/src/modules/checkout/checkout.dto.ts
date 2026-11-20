import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CheckoutAddressDto {
  @IsString() @MinLength(1) @MaxLength(60) firstName!: string;
  @IsString() @MinLength(1) @MaxLength(60) lastName!: string;
  @IsString() @MinLength(3) @MaxLength(120) line1!: string;
  @IsOptional() @IsString() @MaxLength(120) line2?: string;
  @IsString() @MinLength(1) @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(80) state?: string;
  @IsString() @MinLength(2) @MaxLength(20) postalCode!: string;
  @IsString() @Length(2, 2) country!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(40) label?: string;
}

export class CheckoutDto {
  @IsEmail() @MaxLength(254) email!: string;

  @ValidateNested()
  @Type(() => CheckoutAddressDto)
  shippingAddress!: CheckoutAddressDto;

  @IsIn(["standard", "express"]) shippingMethod!: "standard" | "express";

  @IsIn(["SANDBOX_CARD", "CASH_ON_DELIVERY"]) paymentMethod!: "SANDBOX_CARD" | "CASH_ON_DELIVERY";

  @IsOptional() @IsString() @MaxLength(40) couponCode?: string;

  @IsOptional() @IsString() @MaxLength(500) customerNote?: string;

  @IsString() @MinLength(8) @MaxLength(100) idempotencyKey!: string;

  @IsOptional() @IsBoolean() saveAddress?: boolean;
}

export class QuoteDto {
  @IsOptional() @IsString() @MaxLength(40) couponCode?: string;
  @IsOptional() @IsIn(["standard", "express"]) shippingMethod?: "standard" | "express";
}
