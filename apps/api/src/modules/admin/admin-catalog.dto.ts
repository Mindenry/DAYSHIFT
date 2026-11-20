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
  ValidateNested,
} from "class-validator";
import { PartialType } from "@nestjs/swagger";
import { PageQuery } from "../../common/pagination";

export class ProductImageInputDto {
  @IsString() @MinLength(1) @MaxLength(500) url!: string;
  @IsString() @MinLength(1) @MaxLength(200) alt!: string;
  @IsOptional() @IsString() @MaxLength(60) color?: string;
}

export class VariantInputDto {
  @IsString() @MinLength(2) @MaxLength(60) sku!: string;
  @IsOptional() @IsString() @MaxLength(30) size?: string;
  @IsOptional() @IsString() @MaxLength(40) color?: string;
  @IsOptional() @IsString() @MaxLength(9) colorHex?: string;
  @IsOptional() @IsNumber() @Min(0) priceOverride?: number;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100000) initialStock?: number;
}

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @MinLength(2) @MaxLength(180) slug!: string;
  @IsString() @MinLength(2) @MaxLength(60) sku!: string;
  @IsOptional() @IsString() @MaxLength(300) shortDescription?: string;
  @IsString() @MinLength(20) description!: string;
  @IsOptional() @IsString() brandId?: string;
  @IsIn(["DRAFT", "ACTIVE", "ARCHIVED", "DISCONTINUED"]) status!: string;
  @IsIn(["PUBLIC", "HIDDEN"]) visibility!: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsNumber() @Min(0) compareAtPrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsString() @MaxLength(300) material?: string;
  @IsOptional() @IsString() @MaxLength(500) careInstructions?: string;
  @IsOptional() @IsString() @MaxLength(500) fitNotes?: string;
  @IsOptional() @IsArray() features?: string[];
  @IsOptional() @IsArray() tags?: string[];
  @IsArray() @IsString({ each: true }) categoryIds!: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) collectionIds?: string[];
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsString() @MaxLength(160) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) metaDescription?: string;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ProductImageInputDto) images?: ProductImageInputDto[];
  @IsOptional() @ValidateNested({ each: true }) @Type(() => VariantInputDto) variants?: VariantInputDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class VariantUpdateDto {
  @IsOptional() @IsString() @MaxLength(30) size?: string;
  @IsOptional() @IsString() @MaxLength(40) color?: string;
  @IsOptional() @IsString() @MaxLength(9) colorHex?: string;
  @IsOptional() @IsNumber() @Min(0) priceOverride?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(80) barcode?: string;
}

export class AdminProductQueryDto implements PageQuery {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() @MaxLength(30) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class BulkProductDto {
  @IsArray() @IsString({ each: true }) ids!: string[];
  @IsIn(["activate", "archive", "feature", "unfeature", "draft"]) action!: string;
}

export class CategoryInputDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @MinLength(2) @MaxLength(140) slug!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsOptional() @IsString() parentId?: string | null;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() @MaxLength(160) metaTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) metaDescription?: string;
}
export class UpdateCategoryDto extends PartialType(CategoryInputDto) {}

export class CollectionInputDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @MinLength(2) @MaxLength(140) slug!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(500) imageUrl?: string;
  @IsOptional() @IsIn(["EDITORIAL", "NEW_ARRIVALS", "BEST_SELLERS", "SALE", "SEASONAL", "LIMITED"]) type?: string;
  @IsOptional() @IsInt() position?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() startsAt?: string;
  @IsOptional() @IsString() endsAt?: string;
}
export class UpdateCollectionDto extends PartialType(CollectionInputDto) {}

export class BrandInputDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsString() @MinLength(2) @MaxLength(140) slug!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateBrandDto extends PartialType(BrandInputDto) {}
