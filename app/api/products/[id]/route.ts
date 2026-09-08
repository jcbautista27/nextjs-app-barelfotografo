import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { isProductCategory } from "@/lib/catalog";
import { toPEN } from "@/lib/money";
import type { ProductCategory } from "@/lib/catalog";

function normalizeProduct(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as ProductCategory,
    price: Number(row.price),
    active: row.active as boolean,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const patch: Record<string, unknown> = {};

  if ("name" in (body ?? {})) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del producto es obligatorio." },
        { status: 400 }
      );
    }
    if (name.length > 150) {
      return NextResponse.json(
        { error: "El nombre es demasiado largo." },
        { status: 400 }
      );
    }
    patch.name = name;
  }

  if ("category" in (body ?? {})) {
    if (!isProductCategory(body.category)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
    }
    patch.category = body.category;
  }

  if ("price" in (body ?? {})) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "El precio debe ser un número mayor o igual a 0." },
        { status: 400 }
      );
    }
    patch.price = toPEN(price);
  }

  if ("active" in (body ?? {})) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "El estado activo debe ser verdadero o falso." },
        { status: 400 }
      );
    }
    patch.active = body.active;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No hay campos para actualizar." }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", id)
    .select("id, name, category, price, active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "No se pudo actualizar el producto." },
      { status: 500 }
    );
  }
  return NextResponse.json({ product: normalizeProduct(data) });
}