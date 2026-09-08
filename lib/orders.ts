import { toPEN } from "@/lib/money";
import type { PaymentMethod } from "@/lib/catalog";

export const ORDER_TYPES = ["mesa", "directo"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = ["open", "closed", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
};

export type Order = {
  id: string;
  type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  table_label: string | null;
  opened_by: string;
  opened_by_name: string | null;
  opened_at: string;
  closed_at: string | null;
  payment_method: PaymentMethod | null;
  stored_total: number | null;
  items: OrderItem[];
  total: number;
};

/** Convierte un monto (number o string de PostgREST) a centavos enteros. */
function toCents(value: number | string): number {
  return Math.round(Number(value) * 100);
}

/** Subtotal de una línea: quantity × unit_price (sin redondeos intermedios). */
export function computeLineSubtotal(
  quantity: number,
  unit_price: number | string
): number {
  return (quantity * toCents(unit_price)) / 100;
}

/** Total de una orden: suma exacta en centavos de quantity × unit_price. */
export function computeOrderTotal(items: { quantity: number; unit_price: number | string }[]): number {
  const cents = items.reduce(
    (acc, item) => acc + item.quantity * toCents(item.unit_price),
    0
  );
  return toPEN(cents / 100);
}