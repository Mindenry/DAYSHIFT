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
  ValidateNested,
} from "class-validator";

export class InventoryQueryDto {
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsOptional() @IsString() lowStock?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
}

export class AdjustStockDto {
  @IsString() variantId!: string;
  @IsString() warehouseId!: string;
  @Type(() => Number) @IsInt() quantityDelta!: number;
  @IsString() @MaxLength(300) reason!: string;
  @IsOptional() @IsIn(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "DAMAGE", "RECONCILIATION"]) type?: string;
}

export class TransferStockDto {
  @IsString() variantId!: string;
  @IsString() fromWarehouseId!: string;
  @IsString() toWarehouseId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

export class WarehouseInputDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(20) code!: string;
  @IsString() @MaxLength(160) line1!: string;
  @IsString() @MaxLength(80) city!: string;
  @IsOptional() @IsString() @MaxLength(80) state?: string;
  @IsString() @MaxLength(20) postalCode!: string;
  @IsString() @MaxLength(2) country!: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class SupplierInputDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(30) code!: string;
  @IsOptional() @IsString() @MaxLength(120) contactName?: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class PurchaseOrderItemDto {
  @IsString() variantId!: string;
  @Type(() => Number) @IsInt() @Min(1) quantity!: number;
  @Type(() => Number) @IsNumber() @Min(0) unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsString() supplierId!: string;
  @IsString() warehouseId!: string;
  @IsOptional() @IsString() expectedAt?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
  @IsIn(["DRAFT", "ORDERED"]) status!: "DRAFT" | "ORDERED";
  @IsArray() @ValidateNested({ each: true }) @Type(() => PurchaseOrderItemDto) items!: PurchaseOrderItemDto[];
}

export class OrderNoteDto {
  @IsString() @MaxLength(2000) notes!: string;
}

export class OrderStatusDto {
  @IsString() status!: string;
  @IsOptional() @IsString() @MaxLength(300) reason?: string;
}
