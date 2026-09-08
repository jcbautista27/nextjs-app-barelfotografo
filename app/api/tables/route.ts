import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOpenOrdersForTables } from "@/lib/orders-server";

type TableRow = Record<string, unknown>;

function normalizeTable(
  row: TableRow,
  open: { order_id: string | null; total: number | null }
) {
  return {
    id: row.id as string,
    label: row.label as string,
    active: row.active as boolean,
    open_order_id: open.order_id,
    open_total: open.total,
  };
}

export async function GET() {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const supabase = getAdminClient();
  let query = supabase
    .from("tables")
    .select("id, label, active")
    .order("label", { ascending: true });

  if (auth.session.role === "waiter") {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar las mesas." },
      { status: 500 }
    );
  }

  const rows = data ?? [];
  let openInfo: Map<string, { order_id: string; total: number }> = new Map();
  try {
    openInfo = await loadOpenOrdersForTables(
      supabase,
      rows.map((row) => row.id as string)
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudieron cargar las mesas." },
      { status: 500 }
    );
  }

  const tables = rows.map((row) => {
    const info = openInfo.get(row.id as string);
    return normalizeTable(row, {
      order_id: info?.order_id ?? null,
      total: info?.total ?? null,
    });
  });

  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const label = typeof body?.label === "string" ? body.label.trim() : "";

  if (!label) return NextResponse.json({ error: "El nombre de la mesa es obligatorio." }, { status: 400 });
  if (label.length > 40) return NextResponse.json({ error: "El nombre es demasiado largo." }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("tables")
    .insert({ label })
    .select("id, label, active")
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo crear la mesa." }, { status: 500 });
  }
  return NextResponse.json(
    {
      table: normalizeTable(data, {
        order_id: null,
        total: null,
      }),
    },
    { status: 201 }
  );
}