"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/money";
import type { TableWithOpen } from "@/components/orders/order-api";
import { getTables } from "@/components/orders/order-api";

const POLL_MS = 8000;

export function MesasGrid() {
  const [tables, setTables] = useState<TableWithOpen[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const data = await getTables();
        if (!active) return;
        setTables(data.tables.filter((t) => t.active));
        setInitError(null);
      } catch (err) {
        if (!active) return;
        setInitError((prev) =>
          prev ??
          (err instanceof Error ? err.message : "No se pudieron cargar las mesas.")
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Mesas</h1>
          <p className="text-sm text-muted-foreground">
            Toca una mesa para ver o abrir su cuenta
          </p>
        </div>
        <Button render={<Link href="/venta-directa" />}>
          <ShoppingCart /> Venta directa
        </Button>
      </div>

      {initError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-center text-sm text-destructive">
          {initError}
        </div>
      ) : loading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Cargando mesas…
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          No hay mesas configuradas.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tables.map((table) => {
            const occupied = table.open_order_id !== null;
            return (
              <Link
                key={table.id}
                href={`/mesas/${table.id}`}
                className={`rounded-xl border p-4 transition-colors ${
                  occupied
                    ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-muted hover:bg-muted/70"
                }`}
              >
                <div className="text-sm font-bold">{table.label}</div>
                <div className="mt-2">
                  {occupied ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <span className="size-1.5 rounded-full bg-current" />
                      Ocupada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5B9279]/15 px-2.5 py-0.5 text-xs font-medium text-[#5B9279]">
                      <span className="size-1.5 rounded-full bg-current" />
                      Libre
                    </span>
                  )}
                </div>
                {occupied ? (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {formatPEN(table.open_total ?? 0)} acumulado
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          render={<Link href="/venta-directa" />}
        >
          <Plus /> Venta directa
        </Button>
      </div>
    </div>
  );
}