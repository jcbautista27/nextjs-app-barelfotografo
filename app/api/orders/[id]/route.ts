import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const supabase = getAdminClient();
  try {
    const order = await loadOrderDetail(supabase, id);
    if (!order) {
      return NextResponse.json(
        { error: "La cuenta no existe." },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la cuenta." },
      { status: 500 }
    );
  }
}