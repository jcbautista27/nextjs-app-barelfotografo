import { BUSINESS_TIME_ZONE, wallToDate } from "@/lib/reports";

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type HistoryResult =
  | { error: string }
  | { from: Date | null; toExclusive: Date | null };

function parseDay(input: string): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!DATE_RE.test(input)) return null;
  const [year, month, day] = input.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

/**
 * Convierte los filtros de fecha (AA-MM-DD, hora de pared del negocio)
 * en un rango [inicio+00:00, siguiente día+00:00) sobre `closed_at` (UTC).
 * `from` y `to` son opcionales de forma independiente.
 */
export function historyRange(
  fromInput: string | null,
  toInput: string | null
): HistoryResult {
  const from = fromInput ? parseDay(fromInput) : null;
  const to = toInput ? parseDay(toInput) : null;

  if (fromInput && !from) {
    return {
      error: "La fecha 'desde' es inválida. Usa el formato AAAA-MM-DD.",
    };
  }
  if (toInput && !to) {
    return {
      error: "La fecha 'hasta' es inválida. Usa el formato AAAA-MM-DD.",
    };
  }
  if (from && to) {
    const fromUtc = Date.UTC(from.year, from.month - 1, from.day);
    const toUtc = Date.UTC(to.year, to.month - 1, to.day);
    if (toUtc < fromUtc) {
      return {
        error: "La fecha 'hasta' no puede ser anterior a la 'desde'.",
      };
    }
  }

  const at = new Date();
  const fromStart = from
    ? wallToDate(
        BUSINESS_TIME_ZONE,
        { ...from, hour: 0, minute: 0, second: 0 },
        at
      )
    : null;
  const toStart = to
    ? wallToDate(
        BUSINESS_TIME_ZONE,
        { ...to, hour: 0, minute: 0, second: 0 },
        at
      )
    : null;

  return {
    from: fromStart,
    toExclusive: toStart ? new Date(toStart.getTime() + DAY_MS) : null,
  };
}