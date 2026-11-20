"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clientApi } from "@/lib/api";

interface Agent { id: string; firstName: string; lastName: string; email: string }

export function TicketWorkspace({
  id,
  status,
  priority,
  assignedToId,
  agents,
}: {
  id: string;
  status: string;
  priority: string;
  assignedToId: string | null;
  agents: Agent[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentPriority, setCurrentPriority] = useState(priority);
  const [assignee, setAssignee] = useState(assignedToId ?? "");

  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Reply</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy("reply");
            try {
              await clientApi(`/admin/tickets/${id}/reply`, {
                method: "POST",
                body: JSON.stringify({ body, internal }),
              });
              setBody("");
              toast(internal ? "Internal note added" : "Reply sent to customer");
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not send reply");
            } finally {
              setBusy(null);
            }
          }}
        >
          <textarea className="field" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder={internal ? "Internal note (customer never sees this)" : "Reply to the customer"} required />
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-3.5 w-3.5 accent-[#3f5b4a]" />
            Internal note only
          </label>
          <button type="submit" disabled={busy === "reply" || !body.trim()} className="a-btn w-full">{busy === "reply" ? "Sending…" : internal ? "Add internal note" : "Send reply"}</button>
        </form>
      </section>

      <section className="panel p-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em]">Ticket settings</h2>
        <form
          className="mt-3 space-y-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy("update");
            try {
              await clientApi(`/admin/tickets/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: currentStatus, priority: currentPriority, assignedToId: assignee || null }),
              });
              toast("Ticket updated");
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not update ticket");
            } finally {
              setBusy(null);
            }
          }}
        >
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="field" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}>
              {["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "WAITING_FOR_INTERNAL_TEAM", "RESOLVED", "CLOSED"].map((value) => <option key={value} value={value}>{value.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select id="priority" className="field" value={currentPriority} onChange={(e) => setCurrentPriority(e.target.value)}>
              {["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="agent">Assigned agent</label>
            <select id="agent" className="field" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName}</option>)}
            </select>
          </div>
          <button type="submit" disabled={busy === "update"} className="a-btn a-btn-outline w-full">{busy === "update" ? "Saving…" : "Update ticket"}</button>
        </form>
      </section>
    </div>
  );
}
