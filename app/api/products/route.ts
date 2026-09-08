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

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const supabase = getAdminClient();
  let query = supabase
    .from("products")
    .select("id, name, category, price, active")
    .order("name", { ascending: true });

  if (auth.session.role === "waiter") {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar el catálogo." },
      { status: 500 }
    );
  }
  return NextResponse.json({ products: (data ?? []).map(normalizeProduct) });
}

export async function POST(request: Request) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const category = body?.category;
  const price = Number(body?.price);

  if (!name) return badRequest("El nombre del producto es obligatorio.");
  if (name.length > 150) return badRequest("El nombre es demasiado largo.");
  if (!isProductCategory(category)) return badRequest("Categoría inválida.");
  if (!Number.isFinite(price) || price < 0) {
    return badRequest("El precio debe ser un número mayor o igual a 0.");
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({ name, category, price: toPEN(price) })
    .select("id, name, category, price, active")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear el producto." },
      { status: 500 }
    );
  }
  return NextResponse.json({ product: normalizeProduct(data) }, { status: 201 });
}