import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  aggregateSales,
  periodRange,
  type ReportPeriod,
} from "@/lib/reports";

export type SalesReport = {
  period: ReportPeriod;
  from: string;
  to: string;
  total: number;
  salesCount: number;
  products: { name: string; quantity: number; revenue: number }[];
};

/** Genera el reporte de ventas de un período, considerando solo órdenes cerradas. */
export async function loadSalesReport(
  period: ReportPeriod
): Promise<SalesReport> {
  const { from, to } = periodRange(period);
  const supabase = getAdminClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total, payment_method")
    .eq("status", "closed")
    .gte("closed_at", from.toISOString())
    .lte("closed_at", to.toISOString());

  if (ordersError) {
    throw new Error("No se pudo calcular el reporte de ventas.");
  }

  const ids = (orders ?? []).map((order) => order.id);
  let items: { name: string; quantity: number; unit_price: number }[] = [];

  if (ids.length > 0) {
    const { data: rawItems, error: itemsError } = await supabase
      .from("order_items")
      .select("products(name), quantity, unit_price")
      .in("order_id", ids);

    if (itemsError) {
      throw new Error("No se pudo calcular los productos vendidos.");
    }

    items = (rawItems ?? []).map((item) => ({
      name: (item.products as { name?: string } | null)?.name ?? "Producto",
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));
  }

  const { total, salesCount, products } = aggregateSales(
    (orders ?? []).map((order) => ({
      total: Number(order.total),
      payment_method: order.payment_method,
    })),
    items
  );

  return {
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    total,
    salesCount,
    products,
  };
}