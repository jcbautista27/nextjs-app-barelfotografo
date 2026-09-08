"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/orders";
import type { TableWithOpen } from "@/components/orders/order-api";
import {
  getTable,
  getOrder,
  openOrder,
} from "@/components/orders/order-api";
import { OrderEditor } from "@/components/orders/order-editor";

const POLL_MS = 8000;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-PE", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MesaDetail({ tableId }: { tableId: string }) {
  const [table, setTable] = useState<TableWithOpen | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const isOffline = useOffline();

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const data = await getTable(tableId);
        if (!active) return;
        setTable(data.table);
        if (data.table.open_order_id) {
          const res = await getOrder(data.table.open_order_id);
          if (active) setOrder(res.order);
        } else {
          if (active) setOrder(null);
        }
      } catch (err) {
        if (!active) return;
        toast.error(
          err instanceof Error ? err.message : "No se pudo cargar la mesa."
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
  }, [tableId]);

  async function openAccount() {
    setOpening(true);
    try {
      const res = await openOrder({ type: "mesa", table_id: tableId });
      const data = await getOrder(res.order.id);
      setOrder(data.order);
      setTable((prev) =>
        prev
          ? { ...prev, open_order_id: res.order.id, open_total: 0 }
          : prev
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo abrir la cuenta.";
      if (message.includes("cuenta abierta")) toast.warning(message);
      else toast.error(message);
    } finally {
      setOpening(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Cargando mesa…
      </div>
    );
  }

  if (!table) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          La mesa no existe.
        </div>
      </div>
    );
  }

  if (!table.active) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          Esta mesa está desactivada.
        </div>
      </div>
    );
  }

  const occupied = table.open_order_id !== null;

  return (
    <div className="space-y-4">
      <BackLink />

      <div>
        <h1 className="text-lg font-bold">{table.label}</h1>
        {order ? (
          <p className="text-sm text-muted-foreground">
            {order.opened_by_name
              ? `Cuenta abierta por ${order.opened_by_name}`
              : "Cuenta abierta"}
            {order.opened_at ? ` · ${formatTime(order.opened_at)}` : ""}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Mesa libre</p>
        )}
      </div>

      {order ? (
        <OrderEditor
          order={order}
          onChanged={() => {
            if (table.open_order_id) {
              void getOrder(table.open_order_id).then((res) =>
                setOrder(res.order)
              );
            }
          }}
          cobroLabel="Cobrar cuenta"
        />
      ) : occupied ? (
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          Cargando cuenta…
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Esta mesa está libre. ¿Quieres abrir una cuenta nueva?
          </p>
          <Button
            className="mt-4"
            size="lg"
            disabled={opening || isOffline}
            title={isOffline ? "Sin conexión" : undefined}
            onClick={() => void openAccount()}
          >
            <Plus /> Abrir cuenta
          </Button>
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/mesas"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Mesas
    </Link>
  );
}