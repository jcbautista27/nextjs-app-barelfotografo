import type { Order } from "@/lib/orders";
import type { PaymentMethod } from "@/lib/catalog";

export type { Order, OrderItem } from "@/lib/orders";
export type { PaymentMethod } from "@/lib/catalog";

export type TableWithOpen = {
  id: string;
  label: string;
  active: boolean;
  open_order_id: string | null;
  open_total: number | null;
};

export type OrderResult = { order: Order | null };

async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Ocurrió un error. Intenta de nuevo.");
  }
  return body as T;
}

export function getTables(): Promise<{ tables: TableWithOpen[] }> {
  return api("/api/tables");
}

export function getTable(id: string): Promise<{ table: TableWithOpen }> {
  return api(`/api/tables/${id}`);
}

export function getOrder(id: string): Promise<OrderResult> {
  return api(`/api/orders/${id}`);
}

export function getCurrentDirecto(): Promise<OrderResult> {
  return api("/api/orders/current");
}

export function openOrder(payload: {
  type: "mesa" | "directo";
  table_id?: string;
}): Promise<{ order: { id: string } }> {
  return api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function addItem(
  orderId: string,
  payload: { product_id: string; quantity: number; notes?: string | null }
): Promise<OrderResult> {
  return api(`/api/orders/${orderId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateItem(
  orderId: string,
  itemId: string,
  payload: { quantity?: number; notes?: string | null }
): Promise<OrderResult> {
  return api(`/api/orders/${orderId}/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function removeItem(
  orderId: string,
  itemId: string
): Promise<OrderResult> {
  return api(`/api/orders/${orderId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export function closeOrder(
  orderId: string,
  paymentMethod: PaymentMethod
): Promise<OrderResult> {
  return api(`/api/orders/${orderId}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_method: paymentMethod }),
  });
}