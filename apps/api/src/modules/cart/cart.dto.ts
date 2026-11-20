import { Type } from "class-transformer";
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class AddCartItemDto {
  @IsString()
  @MinLength(1)
  variantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class UpdateCartItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  quantity!: number;
}

export class ApplyCouponDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  code!: string;
}
