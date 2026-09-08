import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { getOpenOrderForTable } from "@/lib/orders-server";
import type { OrderType } from "@/lib/orders";

export async function POST(request: Request) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const type = body?.type as unknown;

  if (type !== "mesa" && type !== "directo") {
    return NextResponse.json(
      { error: "El tipo de orden no es válido." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  let tableId: string | null = null;

  if (type === "mesa") {
    tableId = typeof body?.table_id === "string" ? body.table_id : "";
    if (!tableId) {
      return NextResponse.json(
        { error: "Selecciona una mesa." },
        { status: 400 }
      );
    }

    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("id, active")
      .eq("id", tableId)
      .maybeSingle();

    if (tableError) {
      return NextResponse.json(
        { error: "No se pudo cargar la mesa." },
        { status: 500 }
      );
    }
    if (!table) {
      return NextResponse.json(
        { error: "La mesa no existe." },
        { status: 404 }
      );
    }
    if (!table.active) {
      return NextResponse.json(
        { error: "La mesa está desactivada y no se puede usar." },
        { status: 400 }
      );
    }

    const openOrderId = await getOpenOrderForTable(supabase, tableId);
    if (openOrderId) {
      return NextResponse.json(
        { error: "Esta mesa ya tiene una cuenta abierta." },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .insert({
      type: type as OrderType,
      table_id: type === "mesa" ? tableId : null,
      status: "open",
      opened_by: auth.session.userId,
    })
    .select("id, type, status, table_id, opened_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo abrir la cuenta." },
      { status: 500 }
    );
  }

  return NextResponse.json({ order: data }, { status: 201 });
}