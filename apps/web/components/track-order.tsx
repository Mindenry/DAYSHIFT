"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";
import { OrderDetailView, type OrderView } from "./order-detail-view";

export function TrackOrder() {
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (order) {
    return (
      <div>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="overline text-muted">Order</p>
            <p className="font-display text-3xl">{order.orderNumber}</p>
          </div>
          <button type="button" onClick={() => setOrder(null)} className="btn btn-outline !min-h-10 !px-4">
            Look up another order
          </button>
        </div>
        <OrderDetailView order={order} />
      </div>
    );
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setLoading(true);
        setError(null);
        try {
          const result = await clientApi<OrderView>("/orders/lookup", {
            method: "POST",
            body: JSON.stringify({
              orderNumber: String(data.get("orderNumber")).trim(),
              email: String(data.get("email")).trim(),
            }),
          });
          setOrder(result);
        } catch (lookupError) {
          setError(lookupError instanceof Error ? lookupError.message : "Order not found.");
        } finally {
          setLoading(false);
        }
      }}
      className="max-w-md space-y-4"
    >
      {error && <div role="alert" className="border border-sale/40 bg-sale/5 p-3 text-sm text-sale">{error}</div>}
      <div>
        <label htmlFor="track-order" className="label">Order number</label>
        <input id="track-order" name="orderNumber" required className="field" placeholder="DS-20260912-000141" />
      </div>
      <div>
        <label htmlFor="track-email" className="label">Email</label>
        <input id="track-email" name="email" type="email" required className="field" placeholder="you@example.com" />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Looking up…" : "Track order"}
      </button>
      <p className="text-xs text-muted">
        Need to change something? <a href="/support" className="underline">Contact customer care</a>.
      </p>
    </form>
  );
}
