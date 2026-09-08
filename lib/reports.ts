import { toPEN } from "@/lib/money";

/** Períodos disponibles para el reporte de ventas. */
export const REPORT_PERIODS = ["day", "week", "month"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

/** Zona horaria del negocio. Perú no usa horario de verano (UTC-5 fijo). */
export const BUSINESS_TIME_ZONE = "America/Lima";

export function isReportPeriod(value: unknown): value is ReportPeriod {
  return (
    typeof value === "string" &&
    (REPORT_PERIODS as readonly string[]).includes(value)
  );
}

type WallClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Hora de pared en una zona horaria determinada (según el reloj local). */
function wallClock(timeZone: string, date: Date): WallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

/** Offset (ms) a sumar a una hora de pared interpretada como UTC para obtener el instante real. */
function tzOffsetMs(timeZone: string, at: Date): number {
  const w = wallClock(timeZone, at);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  const offset = at.getTime() - asUtc;
  // Los husos horarios reales son múltiplos de minut0; así el inicio del
  // período cae exacto sobre el segundo 0 (sin millis arrastrados del "ahora").
  return Math.round(offset / 60_000) * 60_000;
}

/** Convierte una hora de pared en Lima al instante UTC real. */
function wallToDate(timeZone: string, w: WallClock, at: Date): Date {
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return new Date(asUtc + tzOffsetMs(timeZone, at));
}

function dayOfWeek(w: WallClock): number {
  return new Date(Date.UTC(w.year, w.month - 1, w.day, 12, 0, 0)).getUTCDay();
}

/**
 * Rango [inicio, ahora] del período dado, calculado con el reloj local del
 * negocio (America/Lima), no con UTC. La semana empieza el lunes.
 */
export function periodRange(
  period: ReportPeriod,
  at: Date = new Date()
): { from: Date; to: Date } {
  const now = wallClock(BUSINESS_TIME_ZONE, at);
  let start: WallClock;

  if (period === "day") {
    start = { ...now, hour: 0, minute: 0, second: 0 };
  } else if (period === "week") {
    const back = (dayOfWeek(now) - 1 + 7) % 7; // lunes = día 1
    const ms =
      Date.UTC(now.year, now.month - 1, now.day) - back * 86_400_000;
    const monday = new Date(ms);
    start = {
      year: monday.getUTCFullYear(),
      month: monday.getUTCMonth() + 1,
      day: monday.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0,
    };
  } else {
    start = { year: now.year, month: now.month, day: 1, hour: 0, minute: 0, second: 0 };
  }

  return {
    from: wallToDate(BUSINESS_TIME_ZONE, start, at),
    to: at,
  };
}

export type SalesRow = { total: number; payment_method: string | null };

export type SalesItemRow = {
  name: string;
  quantity: number;
  unit_price: number;
};

export type TopProduct = { name: string; quantity: number; revenue: number };

/**
 * Agrega las ventas de un período: total en soles (suma exacta con la misma
 * convención de centavos del cierre) y ranking de productos más vendidos.
 */
export function aggregateSales(
  orders: SalesRow[],
  items: SalesItemRow[]
): { total: number; salesCount: number; products: TopProduct[] } {
  const total = toPEN(
    orders.reduce((acc, order) => {
      const amount = Number(order.total);
      return acc + (Number.isFinite(amount) ? amount : 0);
    }, 0)
  );

  const byProduct = new Map<string, TopProduct>();
  for (const item of items) {
    const entry = byProduct.get(item.name) ?? {
      name: item.name,
      quantity: 0,
      revenue: 0,
    };
    entry.quantity += item.quantity;
    entry.revenue += item.quantity * item.unit_price;
    byProduct.set(item.name, entry);
  }

  const products = [...byProduct.values()]
    .map((p) => ({ ...p, revenue: toPEN(p.revenue) }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10);

  return { total, salesCount: orders.length, products };
}