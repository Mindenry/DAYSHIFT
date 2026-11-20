"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { clientApi, money } from "@/lib/api";

interface CartLine {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantSku: string;
  size: string | null;
  color: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  availableStock: number;
  inStock: boolean;
}

interface Cart {
  id: string;
  lines: CartLine[];
  itemCount: number;
  subtotal: string;
  discountTotal: string;
  shippingEstimate: string;
  taxEstimate: string;
  totalEstimate: string;
  couponCode: string | null;
  coupon: { code: string; description: string | null; amount: string; valid: boolean } | null;
  warnings: string[];
}

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await clientApi<Cart>("/cart");
      setCart(data);
      setCode(data.couponCode ?? "");
    } catch {
      toast.error("Could not load your bag");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
     
  }, []);

  const updateQuantity = async (lineId: string, quantity: number) => {
    setBusyLine(lineId);
    try {
      const data = await clientApi<Cart>(`/cart/items/${lineId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
      window.dispatchEvent(new Event("cart:updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update quantity");
    } finally {
      setBusyLine(null);
    }
  };

  const remove = async (lineId: string, name: string) => {
    setBusyLine(lineId);
    try {
      const data = await clientApi<Cart>(`/cart/items/${lineId}`, { method: "DELETE" });
      setCart(data);
      window.dispatchEvent(new Event("cart:updated"));
      toast(`${name} removed from your bag`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove item");
    } finally {
      setBusyLine(null);
    }
  };

  const applyCoupon = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setCouponBusy(true);
    try {
      const data = await clientApi<Cart>("/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code: code.trim() }),
      });
      setCart(data);
      toast.success(`Code ${code.trim().toUpperCase()} applied`);
      setCouponError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "That code could not be applied";
      setCouponError(message);
      toast.error(message);
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = async () => {
    setCouponBusy(true);
    try {
      const data = await clientApi<Cart>("/cart/coupon", { method: "DELETE" });
      setCart(data);
      setCode("");
      toast("Discount code removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove code");
    } finally {
      setCouponBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-10 py-12 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse bg-sand" />)}
        </div>
        <div className="h-64 animate-pulse bg-sand" />
      </div>
    );
  }

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="py-24 text-center md:py-32">
        <h2 className="font-display text-4xl">Your bag is empty.</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Start with the new arrivals, or revisit a piece you saved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/collections/new-arrivals" className="btn btn-primary">Shop new arrivals</Link>
          <Link href="/account/wishlist" className="btn btn-outline">View wishlist</Link>
        </div>
      </div>
    );
  }

  const freeShippingThreshold = 150;
  const subtotalValue = Number(cart.subtotal);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalValue);
  const shippingProgress = Math.min(100, Math.round((subtotalValue / freeShippingThreshold) * 100));

  return (
    <>
    <div className="grid gap-10 py-8 lg:grid-cols-[1.45fr_0.55fr] lg:gap-16 lg:py-10">
      <div>
        <div className="mb-6 border border-line bg-paper-deep px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em]">
            <span>
              {remainingForFreeShipping === 0
                ? "Your order ships free"
                : `${money(remainingForFreeShipping)} away from free delivery`}
            </span>
            <span className="text-muted">{shippingProgress}%</span>
          </div>
          <div className="mt-2 h-1 w-full bg-line" role="presentation">
            <div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${shippingProgress}%` }} />
          </div>
        </div>

        {cart.warnings.length > 0 && (
          <div className="mb-6 border border-sale/30 bg-sale/5 p-4 text-sm text-sale" role="status">
            {cart.warnings.map((warning) => <p key={warning}>{warning}</p>)}
          </div>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex gap-3 py-5 sm:gap-5">
              <Link href={`/products/${line.productSlug}`} className="block w-20 shrink-0 sm:w-28">
                <div className="aspect-[3/4] overflow-hidden bg-sand">
                  {line.imageUrl && (
                    <img src={line.imageUrl} alt={line.productName} className="h-full w-full object-cover" decoding="async" />
                  )}
                </div>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/products/${line.productSlug}`} className="font-display text-lg leading-snug hover:underline">
                      {line.productName}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted">
                      {line.color} {line.size && `· ${line.size}`}
                    </p>
                    <p className="mt-0.5 hidden text-[10px] uppercase tracking-[0.1em] text-muted/70 sm:block">{line.variantSku}</p>
                    {!line.inStock && <p className="mt-2 text-xs text-sale">Only {line.availableStock} available — adjust quantity</p>}
                  </div>
                  <p className="shrink-0 text-sm">{money(line.lineTotal)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-line">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, line.quantity - 1)}
                      disabled={line.quantity <= 1 || busyLine === line.id}
                      className="flex h-11 w-10 items-center justify-center hover:bg-sand disabled:opacity-40"
                      aria-label={`Decrease quantity of ${line.productName}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-11 w-8 items-center justify-center text-xs">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.id, line.quantity + 1)}
                      disabled={line.quantity >= Math.min(10, line.availableStock) || busyLine === line.id}
                      className="flex h-11 w-10 items-center justify-center hover:bg-sand disabled:opacity-40"
                      aria-label={`Increase quantity of ${line.productName}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.id, line.productName)}
                    disabled={busyLine === line.id}
                    className="inline-flex min-h-11 items-center gap-1 px-2 text-[10px] uppercase tracking-[0.1em] text-muted hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Link href="/collections/new-arrivals" className="overline link-underline">Continue shopping</Link>
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-5 sm:p-6">
          <p className="overline">Order summary</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(cart.subtotal)}</dd></div>
            {Number(cart.discountTotal) > 0 && (
              <div className="flex justify-between text-sale"><dt>Discount</dt><dd>−{money(cart.discountTotal)}</dd></div>
            )}
            <div className="flex justify-between text-muted"><dt>Shipping estimate</dt><dd>{Number(cart.shippingEstimate) === 0 ? "Free" : money(cart.shippingEstimate)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Estimated tax</dt><dd>{money(cart.taxEstimate)}</dd></div>
            <div className="flex justify-between border-t border-line pt-4 text-base font-medium"><dt>Total</dt><dd>{money(cart.totalEstimate)}</dd></div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">Tax and delivery are confirmed at checkout. Prices are in USD.</p>

          <div className="mt-6 border-t border-line pt-5">
            {cart.coupon?.valid ? (
              <div className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="uppercase tracking-[0.1em]">{cart.coupon.code}</p>
                  <p className="text-xs text-muted">{cart.coupon.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sale">−{money(cart.coupon.amount)}</p>
                  <button type="button" onClick={removeCoupon} disabled={couponBusy} className="min-h-11 px-1 text-[11px] underline">Remove</button>
                </div>
              </div>
            ) : (
              <form onSubmit={applyCoupon}>
                <label htmlFor="coupon" className="label">Discount code</label>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="field !min-h-11 flex-1 text-xs uppercase tracking-[0.12em]"
                  />
                  <button type="submit" disabled={couponBusy || !code.trim()} className="btn btn-outline !min-h-11 !px-4">
                    {couponBusy ? "…" : "Apply"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">Try WELCOME10 or DAYSHIFT15.</p>
                {couponError && (
                  <p role="alert" className="mt-2 text-[11px] text-sale">{couponError}</p>
                )}
              </form>
            )}
          </div>

          <Link href="/checkout" className="btn btn-primary mt-6 hidden w-full lg:flex">
            Checkout · {money(cart.totalEstimate)}
          </Link>
          <p className="mt-3 hidden text-center text-[11px] text-muted lg:block">Secure sandbox checkout · No real payment</p>
        </div>

        <div className="mt-6 space-y-2 border border-line p-5 text-xs text-muted">
          <p>Complimentary delivery over $150.</p>
          <p>30-day free returns on unworn pieces.</p>
          <p>Need help? <Link href="/support" className="underline">Contact customer care</Link>.</p>
        </div>
      </aside>
    </div>

    {/* Mobile checkout bar */}
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pt-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Total</p>
          <p className="text-sm">{money(cart.totalEstimate)}</p>
        </div>
        <Link href="/checkout" className="btn btn-primary min-w-[10rem]">
          Checkout
        </Link>
      </div>
    </div>
    <div className="h-20 lg:hidden" aria-hidden />
    </>
  );
}
