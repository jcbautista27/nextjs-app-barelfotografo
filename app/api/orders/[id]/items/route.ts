import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";
import { toPEN } from "@/lib/money";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const productId = typeof body?.product_id === "string" ? body.product_id : "";
  const quantity = Number(body?.quantity);
  const rawNotes = body?.notes;

  if (!productId) {
    return NextResponse.json(
      { error: "Selecciona un producto." },
      { status: 400 }
    );
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { error: "La cantidad debe ser un número entero mayor o igual a 1." },
      { status: 400 }
    );
  }
  let notes: string | null = null;
  if (rawNotes !== undefined && rawNotes !== null) {
    if (typeof rawNotes !== "string") {
      return NextResponse.json(
        { error: "La nota debe ser texto." },
        { status: 400 }
      );
    }
    notes = rawNotes.trim().slice(0, 200) || null;
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

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, price, active")
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    return NextResponse.json(
      { error: "No se pudo cargar el producto." },
      { status: 500 }
    );
  }
  if (!product) {
    return NextResponse.json(
      { error: "El producto no existe." },
      { status: 404 }
    );
  }
  if (!product.active) {
    return NextResponse.json(
      { error: "El producto está desactivado y no se puede agregar." },
      { status: 400 }
    );
  }

  const unitPrice = toPEN(Number(product.price));

  const { data: match } = await supabase
    .from("order_items")
    .select("id, quantity")
    .eq("order_id", id)
    .eq("product_id", productId)
    .eq("unit_price", unitPrice)
    .is("notes", null)
    .maybeSingle();

  const { error: insertError } = match
    ? await supabase
        .from("order_items")
        .update({ quantity: Number(match.quantity) + quantity })
        .eq("id", match.id)
    : await supabase.from("order_items").insert({
        order_id: id,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        notes,
      });

  if (insertError) {
    return NextResponse.json(
      { error: "No se pudo agregar el producto." },
      { status: 500 }
    );
  }

  try {
    const order = await loadOrderDetail(supabase, id);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json(
      { error: "No se pudo agregar el producto." },
      { status: 500 }
    );
  }
}