"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

export function ReviewModeration({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const moderate = async (next: "APPROVED" | "REJECTED" | "PENDING") => {
    setBusy(next);
    try {
      await clientApi(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      toast(`Review ${next.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not moderate review");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      {status !== "APPROVED" && <button type="button" onClick={() => moderate("APPROVED")} disabled={!!busy} className="a-btn a-btn-sm">Approve</button>}
      {status !== "REJECTED" && <button type="button" onClick={() => moderate("REJECTED")} disabled={!!busy} className="a-btn a-btn-outline a-btn-sm">Reject</button>}
      {status !== "PENDING" && <button type="button" onClick={() => moderate("PENDING")} disabled={!!busy} className="a-btn a-btn-outline a-btn-sm">Re-open</button>}
    </div>
  );
}
