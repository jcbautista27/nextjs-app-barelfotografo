import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOpenOrdersForTables } from "@/lib/orders-server";

function normalizeTable(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    label: row.label as string,
    active: row.active as boolean,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("tables")
    .select("id, label, active")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo cargar la mesa." },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Mesa no encontrada." }, { status: 404 });
  }

  let openInfo: Map<string, { order_id: string; total: number }> = new Map();
  try {
    openInfo = await loadOpenOrdersForTables(supabase, [data.id]);
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la mesa." },
      { status: 500 }
    );
  }

  const info = openInfo.get(data.id);
  return NextResponse.json({
    table: {
      ...normalizeTable(data),
      open_order_id: info?.order_id ?? null,
      open_total: info?.total ?? null,
    },
  });
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

  if ("label" in (body ?? {})) {
    const label = typeof body.label === "string" ? body.label.trim() : "";
    if (!label) {
      return NextResponse.json(
        { error: "El nombre de la mesa es obligatorio." },
        { status: 400 }
      );
    }
    if (label.length > 40) {
      return NextResponse.json(
        { error: "El nombre es demasiado largo." },
        { status: 400 }
      );
    }
    patch.label = label;
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
    return NextResponse.json(
      { error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tables")
    .update(patch)
    .eq("id", id)
    .select("id, label, active")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Mesa no encontrada." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "No se pudo actualizar la mesa." },
      { status: 500 }
    );
  }
  return NextResponse.json({ table: normalizeTable(data) });
}