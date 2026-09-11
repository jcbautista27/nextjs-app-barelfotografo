"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPEN } from "@/lib/money";
import { PAYMENT_LABELS } from "@/lib/catalog";
import { getTables, type TableWithOpen } from "@/components/orders/order-api";

type Sale = {
  id: string;
  type: "mesa" | "directo";
  table_label: string | null;
  closed_at: string | null;
  payment_method: keyof typeof PAYMENT_LABELS | null;
  total: number | null;
};

async function api<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (body as { error?: string } | null)?.error ?? "Ocurrió un error. Intenta de nuevo."
    );
  }
  return body as T;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistorialScreen() {
  const [tables, setTables] = useState<TableWithOpen[]>([]);
  const [mesa, setMesa] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((filters: { mesa: string; from: string; to: string }) => {
    const params = new URLSearchParams();
    if (filters.mesa) params.set("mesa", filters.mesa);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const query = params.toString();
    return api<{ sales: Sale[] }>(`/api/history${query ? `?${query}` : ""}`)
      .then((data) => setSales(data.sales))
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "No se pudo cargar el historial."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const loadTables = useCallback(() => {
    return getTables()
      .then((data) => setTables(data.tables))
      .catch(() => void 0);
  }, []);

  useEffect(() => {
    void load({ mesa: "", from: "", to: "" });
    void loadTables();
  }, [load, loadTables]);

  function search() {
    setLoading(true);
    void load({ mesa, from, to });
  }

  function clearFilters() {
    setMesa("");
    setFrom("");
    setTo("");
    setLoading(true);
    void load({ mesa: "", from: "", to: "" });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Historial de ventas</h1>
        <p className="text-sm text-muted-foreground">
          Busca cuentas cobradas por mesa o rango de fechas y vuelve a
          descargar su recibo en PDF.
        </p>
      </div>

      <Card className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">
              Mesa
            </span>
            <select
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Todas (incluye venta directa)</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">
              Desde
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">
              Hasta
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={search} disabled={loading}>
            <Search /> Buscar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={loading || (mesa === "" && from === "" && to === "")}
          >
            <X /> Limpiar filtros
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
          Buscando ventas…
        </div>
      ) : !sales || sales.length === 0 ? (
        <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
          No hay ventas que coincidan con los filtros.
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {sale.table_label ?? "Venta directa"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(sale.closed_at)}
                  {sale.payment_method
                    ? ` · ${PAYMENT_LABELS[sale.payment_method]}`
                    : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right text-sm font-bold tabular-nums">
                  {formatPEN(sale.total ?? 0)}
                </div>
                <a
                  href={`/api/orders/${sale.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Download /> PDF
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}