"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Package } from "lucide-react";
import { clientApi } from "@/lib/api";
import { OrderDetailView, type OrderView } from "./order-detail-view";

export function ConfirmationView({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("ds-last-order");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { orderNumber: string; email: string };
        if (parsed.email) setEmail(parsed.email);
        if (parsed.orderNumber === orderNumber && parsed.email) {
          void lookup(parsed.orderNumber, parsed.email);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    setLoading(false);
     
  }, [orderNumber]);

  const lookup = async (number: string, mail: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientApi<OrderView>("/orders/lookup", {
        method: "POST",
        body: JSON.stringify({ orderNumber: number, email: mail }),
      });
      setOrder(data);
      sessionStorage.setItem("ds-last-order", JSON.stringify({ orderNumber: number, email: mail }));
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Could not find that order.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="wrap py-24">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-sand" />
          <p className="text-sm text-muted">Confirming your order…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="wrap py-20">
        <div className="mx-auto max-w-md">
          <p className="overline text-muted">Order lookup</p>
          <h1 className="mt-2 font-display text-4xl">Find your order</h1>
          <p className="mt-3 text-sm text-muted">Enter the order number and the email used at checkout.</p>
          {error && <div role="alert" className="mt-4 border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void lookup(String(data.get("orderNumber")), String(data.get("email")));
            }}
          >
            <div>
              <label htmlFor="orderNumber" className="label">Order number</label>
              <input id="orderNumber" name="orderNumber" defaultValue={orderNumber} required className="field" placeholder="DS-20261120-000123" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" />
            </div>
            <button type="submit" className="btn btn-primary w-full">Find order</button>
          </form>
        </div>
      </div>
    );
  }

  const paid = order.paymentStatus === "PAID";
  return (
    <div className="wrap py-12 md:py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ink">
          {paid ? <Check className="h-6 w-6" /> : <Package className="h-6 w-6" />}
        </span>
        <p className="overline mt-6 text-muted">{paid ? "Payment received" : "Order received"}</p>
        <h1 className="mt-3 font-display text-5xl leading-tight md:text-6xl">
          Thank you{order.shippingAddress.firstName ? `, ${order.shippingAddress.firstName}` : ""}.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
          {paid
            ? "Your order is confirmed and is being prepared in our studio. We've sent a confirmation to your email and will let you know when it ships."
            : "Your cash-on-delivery order is confirmed. You'll pay when your order arrives. We'll email tracking updates as it moves."}
        </p>
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border border-line px-6 py-4 text-sm">
          <span>Order <strong className="font-normal">{order.orderNumber}</strong></span>
          <span className="text-muted">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      <div className="mt-14">
        <OrderDetailView order={order} />
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className="btn btn-outline">View your orders</Link>
        <Link href="/collections/new-arrivals" className="btn btn-primary">Continue shopping</Link>
      </div>
    </div>
  );
}
