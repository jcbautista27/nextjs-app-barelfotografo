import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import {
  isReportPeriod,
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/lib/reports";
import { loadSalesReport } from "@/lib/reports-server";

export async function GET(request: Request) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const periodParam = url.searchParams.get("period") ?? "day";

  if (!isReportPeriod(periodParam)) {
    return NextResponse.json(
      {
        error: `Período inválido. Usa uno de: ${REPORT_PERIODS.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  try {
    const report = await loadSalesReport(periodParam as ReportPeriod);
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo generar el reporte.",
      },
      { status: 500 }
    );
  }
}