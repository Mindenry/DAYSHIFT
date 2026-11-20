import { PageHeader, Pagination, EmptyState } from "@/components/ui";
import { apiGet, dateTime } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";
import { enumLabel } from "@/lib/messages";
import Link from "next/link";

interface AuditResponse {
  items: Array<{
    id: string; actorType: string; actorId: string | null; actorEmail: string | null;
    action: string; entityType: string; entityId: string | null; createdAt: string;
    after: unknown;
  }>;
  meta: { page: number; total: number; totalPages: number };
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireStaff();
  const { t, locale } = await getI18n();
  const params = await searchParams;
  const action = typeof params.action === "string" ? params.action : "";
  const entityType = typeof params.entityType === "string" ? params.entityType : "";
  const page = typeof params.page === "string" ? params.page : "1";
  const cookie = await getCookieHeader();
  const query = new URLSearchParams({ page });
  if (action) query.set("action", action);
  if (entityType) query.set("entityType", entityType);
  const logs = await apiGet<AuditResponse>(`/admin/audit?${query.toString()}`, { cookie });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Security-relevant actions across the platform."
        actions={logs?.meta ? <span className="a-chip">{t("{count} entries", { count: logs.meta.total })}</span> : null}
      />
      <div className="panel">
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-line p-3">
          <div className="min-w-48 flex-1">
            <label htmlFor="action" className="label">{t("Action contains")}</label>
            <input id="action" name="action" defaultValue={action} placeholder="order.status_changed" className="field" />
          </div>
          <div>
            <label htmlFor="entityType" className="label">{t("Entity")}</label>
            <select id="entityType" name="entityType" defaultValue={entityType} className="field">
              <option value="">{t("All")}</option>
              {["Order", "Product", "Variant", "Inventory", "Refund", "ReturnRequest", "Coupon", "Warehouse", "User", "Role", "Setting", "Shipment"].map((value) => <option key={value} value={value}>{t(value)}</option>)}
            </select>
          </div>
          <button type="submit" className="a-btn a-btn-outline">{t("Filter")}</button>
        </form>
        {!logs?.items.length ? <EmptyState title="No audit entries" /> : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t("When")}</th><th>{t("Actor")}</th><th>{t("Event")}</th><th>{t("Entity")}</th><th>{t("Details")}</th></tr></thead>
                <tbody>
                  {logs.items.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-[10px] text-muted">{dateTime(log.createdAt)}</td>
                      <td className="text-[11px]">{log.actorEmail ?? <span className="text-muted">{enumLabel(locale, log.actorType)}</span>}</td>
                      <td className="font-mono text-[10px]">{log.action}</td>
                      <td className="text-[11px]">{t(log.entityType)}{log.entityId ? <span className="ml-1 text-muted">· {log.entityId.slice(0, 10)}</span> : ""}</td>
                      <td className="max-w-80 truncate font-mono text-[9px] text-muted">{log.after ? JSON.stringify(log.after) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={logs.meta.page} totalPages={logs.meta.totalPages} basePath="/audit" params={{ action, entityType }} />
          </>
        )}
      </div>
      <p className="mt-3 text-[11px] text-muted">
        {t("Audit entries are append-only. Financial records are never deleted.")}{" "}
        <Link href="/system" className="underline">{t("System health")}</Link>.
      </p>
    </div>
  );
}
