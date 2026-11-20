import Link from "next/link";
import type { ProductCardDto } from "@dayshift/types";
import { money } from "@/lib/api";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({
  product,
  priority = false,
  className = "",
}: {
  product: ProductCardDto;
  priority?: boolean;
  className?: string;
}) {
  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  return (
    <article className={`group relative ${className}`}>
      <Link href={`/products/${product.slug}`} className="block">
        <div className="image-zoom relative aspect-[3/4] overflow-hidden bg-sand">
          {product.primaryImage ? (
             
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted">
              Image coming soon
            </div>
          )}
          {product.secondaryImage && product.secondaryImage !== product.primaryImage && (
             
            <img
              src={product.secondaryImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loading="lazy"
            />
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {onSale && (
              <span className="bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-sale">Sale</span>
            )}
            {product.isNew && !onSale && (
              <span className="bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em]">New</span>
            )}
            {!product.inStock && (
              <span className="bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-muted">Sold out</span>
            )}
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[17px] leading-snug">{product.name}</h3>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">
              {product.brand?.name ?? "DAYSHIFT"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className={`text-sm ${onSale ? "text-sale" : ""}`}>{money(product.price)}</p>
              {onSale && (
                <p className="text-xs text-muted line-through">{money(product.compareAtPrice)}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pt-1" aria-hidden>
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="h-3 w-3 rounded-full border border-ink/20"
                style={{ backgroundColor: color.hex ?? "#d8d0c1" }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
        <WishlistButton productId={product.id} productName={product.name} />
      </div>
    </article>
  );
}
