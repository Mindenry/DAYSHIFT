"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

const NEXT: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "PAYMENT_FAILED", "CANCELLED", "ON_HOLD"],
  PAID: ["PROCESSING", "ON_HOLD", "CANCELLED"],
  PROCESSING: ["PICKING", "ON_HOLD", "CANCELLED"],
  PICKING: ["PACKED", "ON_HOLD"],
  PACKED: ["SHIPPED", "ON_HOLD"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  PAYMENT_FAILED: ["PENDING_PAYMENT", "CANCELLED"],
  CANCELLED: [],
  ON_HOLD: ["PAID", "PROCESSING", "CANCELLED"],
  RETURN_REQUESTED: [],
  PARTIALLY_RETURNED: [],
  RETURNED: [],
  REFUND_PENDING: [],
  REFUNDED: [],
};

const SHIPMENT_NEXT: Record<string, string[]> = {
  READY_TO_SHIP: ["PICKED_UP", "IN_TRANSIT", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED_DELIVERY", "RETURN_TO_SENDER"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED_DELIVERY"],
  DELIVERED: [],
  FAILED_DELIVERY: ["OUT_FOR_DELIVERY", "RETURN_TO_SENDER", "CANCELLED"],
  RETURN_TO_SENDER: ["DELIVERED"],
  CANCELLED: [],
};

interface Shipment { id: string; status: string; carrier: string; trackingNumber: string | null }

export function OrderOperations({
  orderNumber,
  status,
  internalNotes,
  shipments,
}: {
  orderNumber: string;
  status: string;
  internalNotes: string | null;
  shipments: Shipment[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState(NEXT[status]?.[0] ?? "");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState(internalNotes ?? "");
  const [carrier, setCarrier] = useState("Northline Express");
  const [service, setService] = useState("Standard");
  const [tracking, setTracking] = useState("");
  const [shipmentId, setShipmentId] = useState(shipments[0]?.id ?? "");
  const [shipmentStatus, setShipmentStatus] = useState("");
  const [shipmentNote, setShipmentNote] = useState("");

  const act = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const activeShipment = shipments.find((shipment) => shipment.id === shipmentId);

  return (
    <div className="space-y-4">
      {NEXT[status]?.length > 0 && (
        <section className="panel p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Advance order</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              act("status", () => clientApi(`/admin/orders/${orderNumber}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: nextStatus, reason: reason || undefined }),
              }), `Order moved to ${nextStatus.replace(/_/g, " ").toLowerCase()}`);
            }}
          >
            <select className="field" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} aria-label="Next status">
              {NEXT[status].map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
            </select>
            <input className="field" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" disabled={busy === "status"} className="a-btn w-full">
              {busy === "status" ? "Updating…" : nextStatus === "CANCELLED" ? "Cancel order" : "Update status"}
            </button>
          </form>
          {nextStatus === "SHIPPED" && !shipments.length && (
            <p className="mt-2 text-[10px] text-warn">Create a shipment first; shipping without tracking is blocked.</p>
          )}
        </section>
      )}

      <section className="panel p-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Internal notes</h2>
        <textarea rows={4} className="field mt-3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible to staff only" />
        <button
          type="button"
          disabled={busy === "notes"}
          onClick={() => act("notes", () => clientApi(`/admin/orders/${orderNumber}/notes`, { method: "PATCH", body: JSON.stringify({ notes }) }), "Notes saved")}
          className="a-btn a-btn-outline mt-2 w-full"
        >
          {busy === "notes" ? "Saving…" : "Save notes"}
        </button>
      </section>

      {["PACKED", "SHIPPED"].includes(status) && (
        <section className="panel p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Create shipment</h2>
          <form
            className="mt-3 space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              act("shipment", () => clientApi(`/admin/orders/${orderNumber}/shipments`, {
                method: "POST",
                body: JSON.stringify({ carrier, service, trackingNumber: tracking || undefined }),
              }), "Shipment created");
            }}
          >
            <input className="field" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Carrier" aria-label="Carrier" />
            <input className="field" value={service} onChange={(e) => setService(e.target.value)} placeholder="Service" aria-label="Service" />
            <input className="field" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number (optional)" aria-label="Tracking number" />
            <button type="submit" disabled={busy === "shipment"} className="a-btn w-full">Create shipment</button>
          </form>
        </section>
      )}

      {shipments.length > 0 && (
        <section className="panel p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Shipment updates</h2>
          <div className="mt-3 space-y-2">
            <select className="field" value={shipmentId} onChange={(e) => { setShipmentId(e.target.value); setShipmentStatus(""); }} aria-label="Shipment">
              {shipments.map((shipment) => <option key={shipment.id} value={shipment.id}>{shipment.carrier} · {shipment.trackingNumber ?? "no tracking"} · {shipment.status}</option>)}
            </select>
            {activeShipment && (
              <>
                <select className="field" value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)} aria-label="Shipment status">
                  <option value="">Choose next status</option>
                  {(SHIPMENT_NEXT[activeShipment.status] ?? []).map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
                </select>
                <input className="field" placeholder="Event description" value={shipmentNote} onChange={(e) => setShipmentNote(e.target.value)} />
                <button
                  type="button"
                  disabled={!shipmentStatus || !shipmentNote || busy === "shipment-status"}
                  onClick={() => act("shipment-status", () => clientApi(`/admin/shipments/${shipmentId}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: shipmentStatus, description: shipmentNote }),
                  }), "Shipment updated")}
                  className="a-btn w-full"
                >
                  {busy === "shipment-status" ? "Updating…" : "Add shipment event"}
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
