import { PageHeader, Stat } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { getCookieHeader, requireStaff } from "@/lib/session";
import { getI18n } from "@/lib/i18n";

interface SystemStatus {
  service: string; version: string; environment: string; database: string; redis: string;
  jobs: Record<string, number>; failedNotifications: number;
  counts: { products: number; orders: number; customers: number };
  uptimeSeconds: number; memory: { rss: number; heapUsed: number };
  timestamp: string;
}

export default async function SystemPage() {
  await requireStaff();
  const { t } = await getI18n();
  const cookie = await getCookieHeader();
  const system = await apiGet<SystemStatus>("/admin/system", { cookie });
  if (!system) return <PageHeader title="System health" description="Status unavailable." />;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="System health"
        description={t("{service} v{version} · {environment} · checked {time}", {
          service: system.service,
          version: system.version,
          environment: system.environment,
          time: new Date(system.timestamp).toLocaleTimeString(),
        })}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="API" value={t("Online")} hint={t("Responding to admin requests")} tone="green" />
        <Stat label="PostgreSQL" value={system.database === "up" ? t("Connected") : t("Down")} hint={t("Primary transactional store")} tone={system.database === "up" ? "green" : "red"} />
        <Stat label="Redis" value={system.redis === "up" ? t("Connected") : t("Degraded")} hint={t("Cache, sessions and queues")} tone={system.redis === "up" ? "green" : "red"} />
        <Stat label="Failed notifications" value={String(system.failedNotifications)} hint={t("Retried by the worker")} tone={system.failedNotifications ? "amber" : "green"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Background jobs")}</h2>
          <dl className="mt-4 space-y-2 text-xs">
            {Object.entries(system.jobs).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-line pb-2">
                <dt className="capitalize text-muted">{t(key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "))}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10px] leading-relaxed text-muted">
            {t("Emails, reservation expiry and payment reconciliation are processed by the dedicated worker. Failed jobs remain in Redis with exponential backoff for five attempts.")}
          </p>
        </section>

        <section className="panel p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Runtime & data")}</h2>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">{t("Uptime")}</dt><dd className="mono">{Math.floor(system.uptimeSeconds / 60)} {t("min")}</dd></div>
            <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">{t("Heap used")}</dt><dd className="mono">{Math.round(system.memory.heapUsed / 1024 / 1024)} MB</dd></div>
            <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">RSS</dt><dd className="mono">{Math.round(system.memory.rss / 1024 / 1024)} MB</dd></div>
            <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">{t("Products")}</dt><dd className="mono">{system.counts.products}</dd></div>
            <div className="flex justify-between border-b border-line pb-2"><dt className="text-muted">{t("Orders")}</dt><dd className="mono">{system.counts.orders}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">{t("Customers")}</dt><dd className="mono">{system.counts.customers}</dd></div>
          </dl>
        </section>
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t("Health endpoints")}</h2>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">
          {t("Public liveness")}: <code className="kbd">GET /api/v1/health</code>. {t("Detailed queue and memory status")}:
          <code className="kbd"> GET /api/v1/health/detailed</code>. {t("These endpoints never expose customer data or secrets.")}
        </p>
      </section>
    </div>
  );
}
