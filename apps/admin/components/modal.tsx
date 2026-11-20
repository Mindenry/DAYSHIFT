"use client";

import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n-client";

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const { t } = useI18n();
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t(title)}
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label={t("Close")} onClick={onClose} />
      <div
        className={`relative max-h-[92vh] w-full ${width} overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 shadow-[0_30px_90px_rgba(15,20,17,0.28)] sm:rounded-2xl`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{t(title)}</h2>
          <button type="button" onClick={onClose} className="a-btn a-btn-ghost a-btn-icon" aria-label={t("Close")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormActions({ busy, onCancel, submitLabel }: { busy: boolean; onCancel: () => void; submitLabel: string }) {
  const { t } = useI18n();
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="a-btn a-btn-outline">{t("Cancel")}</button>
      <button type="submit" disabled={busy} className="a-btn">{busy ? t("Saving…") : t(submitLabel)}</button>
    </div>
  );
}
