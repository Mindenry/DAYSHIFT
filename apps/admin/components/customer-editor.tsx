"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

export function CustomerEditor({
  id,
  notes,
  tags,
  segment,
  status,
}: {
  id: string;
  notes: string | null;
  tags: string[];
  segment: string | null;
  status: string;
}) {
  const router = useRouter();
  const [staffNotes, setStaffNotes] = useState(notes ?? "");
  const [tagInput, setTagInput] = useState(tags.join(", "));
  const [currentSegment, setCurrentSegment] = useState(segment ?? "");
  const [currentStatus, setCurrentStatus] = useState(status);
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await clientApi(`/admin/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          staffNotes,
          tags: tagInput.split(",").map((tag) => tag.trim()).filter(Boolean),
          segment: currentSegment || undefined,
          status: currentStatus,
        }),
      });
      toast("Customer updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update customer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="panel p-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.08em]">CRM</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="label" htmlFor="segment">Segment</label>
          <select id="segment" className="field" value={currentSegment} onChange={(e) => setCurrentSegment(e.target.value)}>
            <option value="">Unassigned</option>
            {["New", "Returning", "High-value", "Inactive", "Frequent buyer"].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tags">Tags (comma separated)</label>
          <input id="tags" className="field" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="notes">Internal notes</label>
          <textarea id="notes" rows={4} className="field" value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="status">Account status</label>
          <select id="status" className="field" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
        <button type="submit" disabled={busy} className="a-btn w-full">{busy ? "Saving…" : "Save customer"}</button>
      </div>
    </form>
  );
}
