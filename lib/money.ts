const formatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

/** Formatea un monto a soles (S/ 12.50). Acepta number o string de PostgREST. */
export function formatPEN(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(amount)) return "S/ 0.00";
  return formatter.format(amount);
}

/** Redondea a 2 decimales (para numeric(10,2)). */
export function toPEN(value: number): number {
  return Math.round(value * 100) / 100;
}