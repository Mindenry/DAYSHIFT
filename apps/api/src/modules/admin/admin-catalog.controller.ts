import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { AdminCatalogService } from "./admin-catalog.service";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CurrentUser, RequirePermissions } from "../../common/decorators";
import { AuthUser } from "../../common/types";
import {
  AdminProductQueryDto,
  BrandInputDto,
  BulkProductDto,
  CategoryInputDto,
  CollectionInputDto,
  CreateProductDto,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateCollectionDto,
  UpdateProductDto,
  VariantInputDto,
  VariantUpdateDto,
} from "./admin-catalog.dto";

@ApiTags("admin")
@ApiCookieAuth("ds_session")
@UseGuards(PermissionsGuard)
@Controller("admin/catalog")
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  private actor(user: AuthUser) {
    return { id: user.id, email: user.email };
  }

  @Get("products")
  @RequirePermissions("products.read")
  products(@Query() query: AdminProductQueryDto) {
    return this.catalog.listProducts(query);
  }

  @Get("products/:id")
  @RequirePermissions("products.read")
  product(@Param("id") id: string) {
    return this.catalog.getProduct(id);
  }

  @Post("products")
  @RequirePermissions("products.create")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.catalog.createProduct(dto, this.actor(user));
  }

  @Patch("products/:id")
  @RequirePermissions("products.update")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.catalog.updateProduct(id, dto, this.actor(user));
  }

  @Post("products/:id/duplicate")
  @RequirePermissions("products.create")
  duplicate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.duplicateProduct(id, this.actor(user));
  }

  @Post("products/:id/archive")
  @RequirePermissions("products.archive")
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.updateProduct(id, { status: "ARCHIVED" }, this.actor(user));
  }

  @Post("products/bulk")
  @RequirePermissions("products.update")
  bulk(@CurrentUser() user: AuthUser, @Body() dto: BulkProductDto) {
    return this.catalog.bulkProducts(dto.ids, dto.action, this.actor(user));
  }

  @Post("products/:id/variants")
  @RequirePermissions("products.update")
  createVariant(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: VariantInputDto) {
    return this.catalog.createVariant(id, dto, this.actor(user));
  }

  @Patch("variants/:id")
  @RequirePermissions("products.update")
  updateVariant(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: VariantUpdateDto) {
    return this.catalog.updateVariant(id, dto, this.actor(user));
  }

  @Delete("variants/:id")
  @RequirePermissions("products.update")
  deactivateVariant(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.deactivateVariant(id, this.actor(user));
  }

  @Get("categories")
  @RequirePermissions("products.read")
  categories() {
    return this.catalog.categories();
  }

  @Post("categories")
  @RequirePermissions("categories.manage")
  createCategory(@CurrentUser() user: AuthUser, @Body() dto: CategoryInputDto) {
    return this.catalog.createCategory(dto, this.actor(user));
  }

  @Patch("categories/:id")
  @RequirePermissions("categories.manage")
  updateCategory(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto as Record<string, unknown>, this.actor(user));
  }

  @Delete("categories/:id")
  @RequirePermissions("categories.manage")
  deleteCategory(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.catalog.deleteCategory(id, this.actor(user));
  }

  @Get("collections")
  @RequirePermissions("products.read")
  collections() {
    return this.catalog.collections();
  }

  @Post("collections")
  @RequirePermissions("collections.manage")
  createCollection(@Body() dto: CollectionInputDto) {
    return this.catalog.createCollection(dto);
  }

  @Patch("collections/:id")
  @RequirePermissions("collections.manage")
  updateCollection(@Param("id") id: string, @Body() dto: UpdateCollectionDto) {
    return this.catalog.updateCollection(id, dto as Record<string, unknown>);
  }

  @Get("brands")
  @RequirePermissions("products.read")
  brands() {
    return this.catalog.brands();
  }

  @Post("brands")
  @RequirePermissions("brands.manage")
  createBrand(@Body() dto: BrandInputDto) {
    return this.catalog.createBrand(dto);
  }

  @Patch("brands/:id")
  @RequirePermissions("brands.manage")
  updateBrand(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.catalog.updateBrand(id, dto);
  }
}
