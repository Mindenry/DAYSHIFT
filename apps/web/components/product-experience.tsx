"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Ruler, ShieldCheck, Truck, X } from "lucide-react";
import { toast } from "sonner";
import type { ProductDetailDto } from "@dayshift/types";
import { clientApi, money } from "@/lib/api";
import { WishlistButton } from "./wishlist-button";

interface ChartShape {
  columns?: string[];
  rows?: string[][];
}

export function ProductExperience({ product }: { product: ProductDetailDto }) {
  const router = useRouter();
  const colors = product.colors.length ? product.colors : [{ name: "Default", hex: null }];
  const firstAvailable = product.variants.find((variant) => variant.inStock);
  const [color, setColor] = useState(firstAvailable?.color ?? colors[0]?.name ?? "");
  const [size, setSize] = useState(
    product.sizes.length === 1 ? product.sizes[0] : firstAvailable?.size ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const variantsForColor = useMemo(
    () => product.variants.filter((variant) => variant.color === color),
    [product.variants, color],
  );
  const selectedVariant = variantsForColor.find((variant) => variant.size === size) ?? null;
  const images = useMemo(() => {
    const byColor = product.images.filter((image) => !image.color || image.color === color);
    return byColor.length ? byColor : product.images;
  }, [product.images, color]);
  const mainImage =
    selectedVariant?.imageUrl ?? images[activeImage]?.url ?? images[0]?.url ?? product.primaryImage;
  const price = selectedVariant?.price ?? product.price;
  const compareAt = product.compareAtPrice;
  const onSale = compareAt && Number(compareAt) > Number(price);
  const maxQuantity = Math.max(1, Math.min(10, selectedVariant?.availableStock ?? 1));
  const canBuy = !!selectedVariant?.inStock;

  const selectColor = (nextColor: string) => {
    setColor(nextColor);
    setActiveImage(0);
    const nextVariants = product.variants.filter((variant) => variant.color === nextColor);
    const currentStillAvailable = nextVariants.find((variant) => variant.size === size && variant.inStock);
    if (!currentStillAvailable) {
      setSize(nextVariants.find((variant) => variant.inStock)?.size ?? "");
    }
    setQuantity(1);
  };

  const add = async (goToCheckout: boolean) => {
    if (!selectedVariant) {
      toast("Choose a size first");
      return;
    }
    if (!canBuy) {
      toast.error("That size and colour is out of stock");
      return;
    }
    setBusy(true);
    try {
      await clientApi("/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId: selectedVariant.id, quantity }),
      });
      window.dispatchEvent(new Event("cart:updated"));
      if (goToCheckout) {
        router.push("/checkout");
      } else {
        toast(`${product.name} added to your bag`, {
          action: { label: "View bag", onClick: () => router.push("/cart") },
        });
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add to bag");
    } finally {
      setBusy(false);
    }
  };

  const chart = (product.sizeGuide?.chart ?? null) as ChartShape | null;

  return (
    <div className="wrap">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 py-6 text-[11px] uppercase tracking-[0.14em] text-muted">
        <Link href="/" className="link-underline">Home</Link>
        {product.categories[0] && (
          <>
            <span aria-hidden>/</span>
            <Link href={`/c/${product.categories[0].slug}`} className="link-underline">
              {product.categories[0].name}
            </Link>
          </>
        )}
        <span aria-hidden>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-sand">
            { }
            <img src={mainImage ?? ""} alt={product.name} className="h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute left-3 top-3 flex flex-col gap-1">
              {onSale && <span className="bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-sale">Sale</span>}
              {product.isNew && <span className="bg-paper px-2 py-1 text-[10px] uppercase tracking-[0.16em]">New</span>}
            </div>
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative aspect-[3/4] overflow-hidden bg-sand ${
                    activeImage === index ? "ring-1 ring-ink ring-offset-2 ring-offset-paper" : "opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={activeImage === index}
                >
                  { }
                  <img src={image.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="overline text-muted">{product.brand?.name ?? "DAYSHIFT"}</p>
          <h1 className="mt-2 font-display text-4xl leading-[1.02] md:text-5xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <p className={`text-lg ${onSale ? "text-sale" : ""}`}>{money(price)}</p>
            {onSale && <p className="text-sm text-muted line-through">{money(compareAt)}</p>}
            {product.rating.count > 0 && (
              <a href="#reviews" className="ml-auto text-xs text-muted underline underline-offset-4">
                {product.rating.average.toFixed(1)} · {product.rating.count} {product.rating.count === 1 ? "review" : "reviews"}
              </a>
            )}
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>

          {/* Colour */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <p className="overline">Colour</p>
              <p className="text-xs text-muted">{color}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => selectColor(entry.name)}
                  aria-label={entry.name}
                  aria-pressed={color === entry.name}
                  className={`h-9 w-9 rounded-full border p-0.5 transition-all ${
                    color === entry.name ? "border-ink" : "border-transparent hover:border-line"
                  }`}
                >
                  <span
                    className="block h-full w-full rounded-full border border-ink/15"
                    style={{ backgroundColor: entry.hex ?? "#d8d0c1" }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <p className="overline">Size</p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-muted underline underline-offset-4"
              >
                <Ruler className="h-3.5 w-3.5" /> Size & fit
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((entry) => {
                const variant = variantsForColor.find((item) => item.size === entry);
                const disabled = !variant?.inStock;
                return (
                  <button
                    key={entry}
                    type="button"
                    onClick={() => { setSize(entry); setQuantity(1); }}
                    disabled={disabled}
                    aria-pressed={size === entry}
                    className={`min-w-12 border px-3 py-2.5 text-[11px] uppercase tracking-[0.1em] transition-colors ${
                      size === entry
                        ? "border-ink bg-ink text-paper"
                        : disabled
                          ? "cursor-not-allowed border-line text-muted/50 line-through"
                          : "border-line hover:border-ink"
                    }`}
                  >
                    {entry}
                  </button>
                );
              })}
            </div>
            {selectedVariant && (
              <p className={`mt-3 text-xs ${canBuy ? "text-muted" : "text-sale"}`}>
                {!canBuy
                  ? "Out of stock in this size"
                  : selectedVariant.availableStock <= 3
                    ? `Low stock — ${selectedVariant.availableStock} left`
                    : "In stock, ready to ship"}
              </p>
            )}
            {product.fitNotes && <p className="mt-2 text-xs leading-relaxed text-muted">{product.fitNotes}</p>}
          </div>

          {/* Quantity + actions */}
          <div className="mt-7 flex items-stretch gap-3">
            <div className="flex items-center border border-line" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="flex h-12 w-11 items-center justify-center hover:bg-sand"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="flex h-12 w-9 items-center justify-center text-sm" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                className="flex h-12 w-11 items-center justify-center hover:bg-sand"
                aria-label="Increase quantity"
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => add(false)}
              disabled={!canBuy || busy}
              className="btn btn-primary flex-1"
            >
              {busy ? "Adding…" : canBuy ? "Add to bag" : "Sold out"}
            </button>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variantId={selectedVariant?.id}
              large
            />
          </div>
          <button
            type="button"
            onClick={() => add(true)}
            disabled={!canBuy || busy}
            className="btn btn-outline mt-2 w-full"
          >
            Buy now
          </button>

          <div className="mt-6 space-y-2 border-t border-line pt-5 text-xs text-muted">
            <p className="flex items-center gap-2"><Truck className="h-4 w-4" /> Free standard delivery over $150 · 3–5 business days</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> 30-day free returns. Secure sandbox checkout.</p>
          </div>

          {/* Details */}
          <div className="mt-8 border-t border-line">
            <details className="group border-b border-line py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
                Description <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                <p>{product.description}</p>
                {product.features.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5">
                    {product.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                )}
              </div>
            </details>
            <details className="group border-b border-line py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
                Materials & care <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                <p>{product.material}</p>
                <p>{product.careInstructions}</p>
              </div>
            </details>
            <details className="group border-b border-line py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
                Delivery & returns <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                <p>Standard delivery is complimentary over $150, otherwise $7.95. Express delivery is available at checkout.</p>
                <p>Returns are free within 30 days of delivery. Items must be unworn with tags attached. Final sale pieces are not returnable.</p>
              </div>
            </details>
            <details className="group border-b border-line py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
                Fit & sizing <span className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                <p>{product.fitNotes}</p>
                <p>SKU {product.sku}{selectedVariant ? ` · ${selectedVariant.sku}` : ""}</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-paper p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="overline text-muted">Size guide</p>
                <h2 className="mt-2 font-display text-3xl">{product.sizeGuide?.name ?? "Size & fit"}</h2>
              </div>
              <button type="button" onClick={() => setSizeGuideOpen(false)} className="flex h-11 w-11 items-center justify-center" aria-label="Close size guide">
                <X className="h-5 w-5" />
              </button>
            </div>
            {chart?.columns && chart?.rows ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink">
                      {chart.columns.map((column) => (
                        <th key={column} className="py-2 pr-4 font-medium uppercase tracking-[0.08em]">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, index) => (
                      <tr key={index} className="border-b border-line">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-2.5 pr-4">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">This piece is one size. See the fit notes for measurements.</p>
            )}
            {product.sizeGuide?.notes && <p className="mt-4 text-xs leading-relaxed text-muted">{product.sizeGuide.notes}</p>}
            <p className="mt-4 text-xs text-muted">Measurements are in centimetres unless stated. Between sizes? Take the larger size for a relaxed fit.</p>
          </div>
        </div>
      )}
    </div>
  );
}
