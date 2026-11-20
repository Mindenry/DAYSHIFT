"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

export function OrderActions({
  orderNumber,
  status,
  canReturn,
}: {
  orderNumber: string;
  status: string;
  canReturn: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const cancellable = ["PENDING_PAYMENT", "PAYMENT_FAILED", "PAID", "PROCESSING", "ON_HOLD"].includes(status);
  const showReturn = canReturn && ["DELIVERED", "COMPLETED", "PARTIALLY_RETURNED"].includes(status);

  return (
    <div className="flex flex-wrap gap-2">
      {showReturn && (
        <Link href={`/account/orders/${orderNumber}/return`} className="btn btn-outline !min-h-10 !px-4">
          Start a return
        </Link>
      )}
      {["DELIVERED", "COMPLETED", "CANCELLED", "RETURNED", "REFUNDED"].includes(status) && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await clientApi<{ added: number; skipped: number }>(`/orders/${orderNumber}/reorder`, { method: "POST" });
              window.dispatchEvent(new Event("cart:updated"));
              if (result.added > 0) {
                toast(`${result.added} ${result.added === 1 ? "piece" : "pieces"} added to your bag`);
                router.push("/cart");
              } else {
                toast("Those pieces are no longer available.");
              }
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not reorder");
            } finally {
              setBusy(false);
            }
          }}
          className="btn btn-primary !min-h-10 !px-4"
        >
          {busy ? "Adding…" : "Order again"}
        </button>
      )}
      {cancellable && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm("Cancel this order? Any payment will be refunded and reserved stock released.")) return;
            setBusy(true);
            try {
              await clientApi(`/orders/${orderNumber}/cancel`, {
                method: "POST",
                body: JSON.stringify({ reason: "Cancelled by customer" }),
              });
              toast("Order cancelled");
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not cancel order");
            } finally {
              setBusy(false);
            }
          }}
          className="btn btn-outline !min-h-10 !px-4"
        >
          Cancel order
        </button>
      )}
    </div>
  );
}
