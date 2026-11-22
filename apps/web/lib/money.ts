export function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
