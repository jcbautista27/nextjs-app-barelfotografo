import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { historyRange } from "@/lib/history";
import type { PaymentMethod } from "@/lib/catalog";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const mesa = url.searchParams.get("mesa")?.trim() || null;
  const from = url.searchParams.get("from")?.trim() || null;
  const to = url.searchParams.get("to")?.trim() || null;

  if (mesa && !UUID_RE.test(mesa)) {
    return NextResponse.json(
      { error: "El filtro de mesa es inválido." },
      { status: 400 }
    );
  }

  const range = historyRange(from, to);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  const supabase = getAdminClient();
  try {
    let query = supabase
      .from("orders")
      .select(
        "id, type, table_id, status, opened_at, closed_at, payment_method, total, tables(label)"
      )
      .eq("status", "closed");

    if (mesa) query = query.eq("table_id", mesa);
    if (range.from) query = query.gte("closed_at", range.from.toISOString());
    if (range.toExclusive)
      query = query.lt("closed_at", range.toExclusive.toISOString());

    query = query.order("closed_at", { ascending: false }).limit(200);

    const { data, error } = await query;
    if (error) throw error;

    const sales = (data ?? []).map((row) => ({
      id: row.id as string,
      type: row.type as string,
      table_id: row.table_id as string | null,
      table_label:
        Array.isArray(row.tables) && row.tables[0]
          ? (row.tables[0].label as string)
          : null,
      opened_at: row.opened_at as string,
      closed_at: row.closed_at as string,
      payment_method: row.payment_method as PaymentMethod | null,
      total: row.total == null ? null : Number(row.total),
    }));

    return NextResponse.json({ sales });
  } catch {
    return NextResponse.json(
      { error: "No se pudo listar el historial." },
      { status: 500 }
    );
  }
}