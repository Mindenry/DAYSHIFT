import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CatalogService } from "./catalog.service";
import { ProductQueryDto, ReviewQueryDto } from "./catalog.dto";
import { Public } from "../../common/decorators";

@ApiTags("catalog")
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("categories")
  categories() {
    return this.catalog.categoryTree();
  }

  @Get("categories/:slug")
  category(@Param("slug") slug: string) {
    return this.catalog.category(slug);
  }

  @Get("collections")
  collections() {
    return this.catalog.collections();
  }

  @Get("collections/:slug")
  collection(@Param("slug") slug: string) {
    return this.catalog.collection(slug);
  }

  @Get("brands")
  brands() {
    return this.catalog.brands();
  }

  @Get("products/facets")
  facets(@Query() query: ProductQueryDto) {
    return this.catalog.facets(query);
  }

  @Get("products/featured")
  featured(@Query("limit") limit?: string) {
    return this.catalog.featured(Math.min(12, Math.max(1, Number(limit) || 8)));
  }

  @Get("products")
  products(@Query() query: ProductQueryDto) {
    return this.catalog.listProducts(query);
  }

  @Get("search/suggestions")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  suggestions(@Query("q") q = "") {
    return this.catalog.suggestions(q);
  }

  @Get("products/:slug")
  product(@Param("slug") slug: string) {
    return this.catalog.product(slug);
  }

  @Get("products/:slug/reviews")
  reviews(@Param("slug") slug: string, @Query() query: ReviewQueryDto) {
    return this.catalog.productReviews(slug, query);
  }

  @Get("variants/:id/availability")
  availability(@Param("id") id: string) {
    return this.catalog.variantAvailability(id);
  }
}
