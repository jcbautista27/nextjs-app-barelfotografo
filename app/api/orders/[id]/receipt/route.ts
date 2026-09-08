import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getAdminClient } from "@/lib/supabase/admin";
import { loadOrderDetail } from "@/lib/orders-server";
import { renderReceiptPdf } from "@/lib/pdf/receipt";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager", "waiter"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const supabase = getAdminClient();

  let order;
  try {
    order = await loadOrderDetail(supabase, id);
  } catch {
    return NextResponse.json(
      { error: "No se pudo cargar la cuenta." },
      { status: 500 }
    );
  }
  if (!order) {
    return NextResponse.json(
      { error: "La cuenta no existe." },
      { status: 404 }
    );
  }
  if (order.status !== "closed") {
    return NextResponse.json(
      { error: "La cuenta aún no se ha cobrado." },
      { status: 400 }
    );
  }

  let pdf: Buffer;
  try {
    pdf = await renderReceiptPdf(order);
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el recibo." },
      { status: 500 }
    );
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recibo-${order.id.slice(0, 8)}.pdf"`,
      "Content-Length": String(pdf.byteLength),
    },
  });
}