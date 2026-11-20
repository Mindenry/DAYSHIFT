"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n-client";

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
  const { t } = useI18n();
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
      toast(t("Customer updated"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Could not update customer"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="panel p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("CRM")}</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label className="label" htmlFor="segment">{t("Segment")}</label>
          <select id="segment" className="field" value={currentSegment} onChange={(e) => setCurrentSegment(e.target.value)}>
            <option value="">{t("Unassigned")}</option>
            {["New", "Returning", "High-value", "Inactive", "Frequent buyer"].map((value) => <option key={value} value={value}>{t(value)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="tags">{t("Tags (comma separated)")}</label>
          <input id="tags" className="field" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="notes">{t("Internal notes")}</label>
          <textarea id="notes" rows={4} className="field" value={staffNotes} onChange={(e) => setStaffNotes(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="status">{t("Account status")}</label>
          <select id="status" className="field" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
            <option value="ACTIVE">{t("Active")}</option>
            <option value="SUSPENDED">{t("Suspended")}</option>
          </select>
        </div>
        <button type="submit" disabled={busy} className="a-btn w-full">{busy ? t("Saving…") : t("Save customer")}</button>
      </div>
    </form>
  );
}
