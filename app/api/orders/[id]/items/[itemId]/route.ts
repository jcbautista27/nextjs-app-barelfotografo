import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id, itemId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if ("quantity" in body) {
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: "La cantidad debe ser un número entero mayor o igual a 1." },
        { status: 400 }
      );
    }
    patch.quantity = quantity;
  }

  if ("notes" in body) {
    const notes = body.notes;
    if (notes !== null && typeof notes !== "string") {
      return NextResponse.json(
        { error: "La nota debe ser texto o vacía." },
        { status: 400 }
      );
    }
    const trimmed = typeof notes === "string" ? notes.trim().slice(0, 200) : null;
    patch.notes = trimmed || null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();

  const existing = await loadOrderDetail(supabase, id);
  if (!existing) {
    return NextResponse.json({ error: "La cuenta no existe." }, { status: 404 });
  }
  if (existing.status !== "open") {
    return NextResponse.json(
      { error: "La cuenta ya está cerrada y no se puede modificar." },
      { status: 409 }
    );
  }
  if (!existing.items.some((item) => item.id === itemId)) {
    return NextResponse.json(
      { error: "El producto no pertenece a esta cuenta." },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("order_items")
    .update(patch)
    .eq("id", itemId)
    .eq("order_id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "No se pudo actualizar el producto." },
      { status: 500 }
    );
  }

  try {
    const order = await loadOrderDetail(supabase, id);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el producto." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id, itemId } = await context.params;
  const supabase = getAdminClient();

  const existing = await loadOrderDetail(supabase, id);
  if (!existing) {
    return NextResponse.json({ error: "La cuenta no existe." }, { status: 404 });
  }
  if (existing.status !== "open") {
    return NextResponse.json(
      { error: "La cuenta ya está cerrada y no se puede modificar." },
      { status: 409 }
    );
  }
  if (!existing.items.some((item) => item.id === itemId)) {
    return NextResponse.json(
      { error: "El producto no pertenece a esta cuenta." },
      { status: 404 }
    );
  }

  const { error: deleteError } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId)
    .eq("order_id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "No se pudo quitar el producto." },
      { status: 500 }
    );
  }

  try {
    const order = await loadOrderDetail(supabase, id);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo quitar el producto." },
      { status: 500 }
    );
  }
}