import { Module } from "@nestjs/common";
import { WishlistController } from "./wishlist.controller";
import { CartModule } from "../cart/cart.module";

@Module({
  imports: [CartModule],
  controllers: [WishlistController],
})
export class WishlistModule {}
