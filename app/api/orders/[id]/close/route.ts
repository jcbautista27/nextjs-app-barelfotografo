import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";
import { isPaymentMethod } from "@/lib/catalog";
import { computeOrderTotal } from "@/lib/orders";
import { toPEN } from "@/lib/money";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const paymentMethod = body?.payment_method;

  if (!isPaymentMethod(paymentMethod)) {
    return NextResponse.json(
      { error: "Selecciona un método de pago válido." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  let order;
  try {
    order = await loadOrderDetail(supabase, id);
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la cuenta." },
      { status: 500 }
    );
  }
  if (!order) {
    return NextResponse.json({ error: "La cuenta no existe." }, { status: 404 });
  }
  if (order.status !== "open") {
    return NextResponse.json(
      { error: "Esta cuenta ya está cerrada y no se puede volver a cobrar." },
      { status: 409 }
    );
  }

  const total = toPEN(computeOrderTotal(order.items));
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
      payment_method: paymentMethod,
      total,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cerrar la cuenta." },
      { status: 500 }
    );
  }

  const closed = await loadOrderDetail(supabase, data.id);
  return NextResponse.json({ order: closed });
}