"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPEN } from "@/lib/money";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
] as const;

type ReportPeriod = (typeof PERIODS)[number]["value"];

type TopProduct = { name: string; quantity: number; revenue: number };

type SalesReport = {
  period: ReportPeriod;
  total: number;
  salesCount: number;
  products: TopProduct[];
};

async function api(url: string) {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Ocurrió un error. Intenta de nuevo.");
  }
  return body;
}

export function ReportesScreen() {
  const [period, setPeriod] = useState<ReportPeriod>("day");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((p: ReportPeriod) => {
    return api(`/api/reports?period=${p}`)
      .then((data) => setReport(data.report))
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "No se pudo cargar el reporte."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load(period);
  }, [period, load]);

  function changePeriod(p: ReportPeriod) {
    if (p === period) return;
    setLoading(true);
    setPeriod(p);
  }

  function refresh() {
    setLoading(true);
    void load(period);
  }

  const title =
    period === "day"
      ? "Ventas de hoy"
      : period === "week"
        ? "Ventas de la semana"
        : "Ventas del mes";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            Ventas por período y productos más vendidos. Solo considera cuentas
            cobradas.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw /> Actualizar
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-border p-1">
        {PERIODS.map((p) => {
          const active = p.value === period;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => changePeriod(p.value)}
              className={cn(
                "flex-1 rounded-full px-4 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {loading ? "…" : formatPEN(report?.total ?? 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Cuentas cobradas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {loading ? "…" : report?.salesCount ?? 0}
          </p>
        </Card>
      </div>

      <Card>
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">Productos más vendidos</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Calculando…
          </div>
        ) : (report?.products.length ?? 0) === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aún no hay ventas en este período.
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {report?.products.map((product, index) => (
              <li
                key={product.name}
                className="flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      index === 0
                        ? "bg-amber-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {product.name}
                  </span>
                </div>
                <div className="shrink-0 text-right text-sm tabular-nums">
                  <span className="font-semibold">{product.quantity} unid.</span>
                  <span className="ml-3 text-muted-foreground">
                    {formatPEN(product.revenue)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}