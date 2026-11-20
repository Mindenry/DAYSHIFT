import { Type } from "class-transformer";
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { PageQuery } from "../../common/pagination";

export class ProductQueryDto implements PageQuery {
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() @MaxLength(120) collection?: string;
  @IsOptional() @IsString() @MaxLength(120) brand?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsString() @MaxLength(30) size?: string;
  @IsOptional() @IsString() @MaxLength(60) color?: string;
  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;
  @IsOptional() @IsBooleanString() inStock?: string;
  @IsOptional()
  @IsIn(["newest", "price-asc", "price-desc", "popular", "rating"])
  sort?: "newest" | "price-asc" | "price-desc" | "popular" | "rating";
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) pageSize?: number;
}

export class ReviewQueryDto implements PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}
