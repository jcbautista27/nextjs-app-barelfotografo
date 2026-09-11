import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
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
  if (order.type !== "mesa") {
    return NextResponse.json(
      { error: "Solo se pueden liberar cuentas de mesa." },
      { status: 400 }
    );
  }
  if (order.status !== "open") {
    return NextResponse.json(
      { error: "Esta cuenta ya está cerrada y no se puede liberar." },
      { status: 409 }
    );
  }
  if (order.items.length > 0) {
    return NextResponse.json(
      {
        error:
          "La cuenta tiene productos agregados; debe cobrarse en lugar de liberarse.",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "open")
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: "No se pudo liberar la mesa." },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "La cuenta cambió de estado. Intenta de nuevo." },
      { status: 409 }
    );
  }

  const released = await loadOrderDetail(supabase, id);
  return NextResponse.json({ order: released });
}