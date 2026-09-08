import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { getUserOpenDirectoOrder, loadOrderDetail } from "@/lib/orders-server";

export async function GET() {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const supabase = getAdminClient();
  try {
    const orderId = await getUserOpenDirectoOrder(
      supabase,
      auth.session.userId
    );
    if (!orderId) {
      return NextResponse.json({ order: null });
    }
    const order = await loadOrderDetail(supabase, orderId);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la venta directa." },
      { status: 500 }
    );
  }
}