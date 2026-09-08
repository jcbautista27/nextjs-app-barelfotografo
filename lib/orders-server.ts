import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { computeOrderTotal } from "@/lib/orders";
import type { Order, OrderItem } from "@/lib/orders";
import type { OrderType } from "@/lib/orders";
import type { PaymentMethod } from "@/lib/catalog";

type Row = Record<string, unknown>;

function num(value: unknown): number {
  return Number(value);
}

function normalizeItem(row: Row): OrderItem {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    name: (row.products as Row | null)?.name as string ?? "",
    quantity: num(row.quantity),
    unit_price: num(row.unit_price),
    notes: row.notes as string | null,
  };
}

export type TableOpenInfo = Map<string, { order_id: string; total: number }>;

function toTableOpenInfo(map: Map<string, { order_id: string; total: number }>) {
  return (tableId: string) =>
    map.get(tableId) ?? { order_id: null, total: null };
}

/**
 * Carga el detalle completo de una orden con sus items, + nombre de la mesa y
 * de quien la abrió. Devuelve null si la orden no existe.
 */
export async function loadOrderDetail(
  supabase: SupabaseClient,
  orderId: string
): Promise<Order | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, type, status, table_id, opened_by, opened_at, closed_at, payment_method, total"
    )
    .eq("id", orderId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  const [itemsResult, tableLabel, opener] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, product_id, quantity, unit_price, notes, products(name)")
      .eq("order_id", orderId),
    order.table_id
      ? supabase
          .from("tables")
          .select("label")
          .eq("id", order.table_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("users")
      .select("name")
      .eq("id", order.opened_by)
      .maybeSingle(),
  ]);

  if (itemsResult.error || tableLabel.error || opener.error) {
    throw itemsResult.error ?? tableLabel.error ?? opener.error;
  }

  const items = (itemsResult.data ?? []).map(normalizeItem);

  return {
    id: order.id,
    type: order.type as OrderType,
    status: order.status as Order["status"],
    table_id: order.table_id as string | null,
    table_label: (tableLabel.data?.label as string | null) ?? null,
    opened_by: order.opened_by as string,
    opened_by_name: (opener.data?.name as string | null) ?? null,
    opened_at: order.opened_at as string,
    closed_at: order.closed_at as string | null,
    payment_method: order.payment_method as PaymentMethod | null,
    stored_total: order.total ? Number(order.total) : null,
    items,
    total: computeOrderTotal(items),
  };
}

/** Devuelve el id de la orden open de una mesa, o null. */
export async function getOpenOrderForTable(
  supabase: SupabaseClient,
  tableId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("type", "mesa")
    .eq("status", "open")
    .eq("table_id", tableId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/** Devuelve la orden directo open más reciente de un usuario, o null. */
export async function getUserOpenDirectoOrder(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("type", "directo")
    .eq("status", "open")
    .eq("opened_by", userId)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

/**
 * Arma un mapa table_id → { order_id, total } para las mesas indicadas,
 * sumando los items de las órdenes mesa open correspondientes.
 */
export async function loadOpenOrdersForTables(
  supabase: SupabaseClient,
  tableIds: string[]
): Promise<TableOpenInfo> {
  const map: TableOpenInfo = new Map();
  if (tableIds.length === 0) return map;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, table_id")
    .eq("type", "mesa")
    .eq("status", "open")
    .in("table_id", tableIds);

  if (error) throw error;

  const orderIds = (orders ?? []).map((order) => order.id as string);
  if (orderIds.length === 0) return map;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("order_id, quantity, unit_price")
    .in("order_id", orderIds);

  if (itemsError) throw itemsError;

  const totals = new Map<string, number>();
  for (const item of items ?? []) {
    const orderId = item.order_id as string;
    const sum = totals.get(orderId) ?? 0;
    totals.set(
      orderId,
      (sum * 100 +
        num(item.quantity) * Math.round(num(item.unit_price) * 100)) /
        100
    );
  }

  for (const order of orders ?? []) {
    const tableId = order.table_id as string;
    const orderId = order.id as string;
    map.set(tableId, {
      order_id: orderId,
      total: Math.round((totals.get(orderId) ?? 0) * 100) / 100,
    });
  }

  return map;
}

export { toTableOpenInfo };