"use client";

import Link from "next/link";
import type { ProductCardDto } from "@dayshift/types";
import { money } from "@/lib/api";
import { WishlistButton } from "./wishlist-button";
import { useI18n } from "@/lib/i18n-client";

export function ProductCard({
  product,
  priority = false,
  revealDelay = 0,
  className = "",
}: {
  product: ProductCardDto;
  priority?: boolean;
  revealDelay?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const onSale = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
  const colors = product.colors.slice(0, 3);

  return (
    <article
      data-reveal
      style={{ "--reveal-delay": `${revealDelay}ms` } as React.CSSProperties}
      className={`group relative flex flex-col transition-transform duration-300 ease-out md:hover:-translate-y-1 ${className}`}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
          {product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-muted">
              {t("Image coming soon")}
            </div>
          )}
          {product.secondaryImage && product.secondaryImage !== product.primaryImage && (
            <img
              src={product.secondaryImage}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
            {onSale && (
              <span className="bg-paper px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-sale">{t("Sale")}</span>
            )}
            {product.isNew && !onSale && (
              <span className="bg-paper px-2 py-1 text-[9px] uppercase tracking-[0.16em]">{t("New")}</span>
            )}
            {!product.inStock && (
              <span className="bg-paper px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-muted">{t("Sold out")}</span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-1 flex-col">
          <h3 className="line-clamp-2 min-h-[2.5em] font-display text-[15px] leading-[1.25] sm:text-[17px]">
            {product.name}
          </h3>
          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px]">
            {product.brand?.name ?? "DAYSHIFT"}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex items-baseline gap-2">
              <p className={`text-[13px] sm:text-sm ${onSale ? "text-sale" : ""}`}>{money(product.price)}</p>
              {onSale && (
                <p className="text-[11px] text-muted line-through">{money(product.compareAtPrice)}</p>
              )}
            </div>
            {colors.length > 0 && (
              <div className="flex items-center gap-1" aria-hidden>
                {colors.map((color) => (
                  <span
                    key={color.name}
                    className="h-2.5 w-2.5 rounded-full border border-ink/20"
                    style={{ backgroundColor: color.hex ?? "#d8d0c1" }}
                    title={color.name}
                  />
                ))}
                {product.colors.length > 3 && (
                  <span className="text-[9px] text-muted">+{product.colors.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute right-2.5 top-2.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <WishlistButton productId={product.id} productName={product.name} />
      </div>
    </article>
  );
}
