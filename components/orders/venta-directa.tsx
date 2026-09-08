"use client";

import { useEffect, useState } from "react";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/orders";
import { getCurrentDirecto, getOrder, openOrder } from "@/components/orders/order-api";
import { OrderEditor } from "@/components/orders/order-editor";

const POLL_MS = 8000;

export function VentaDirecta() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const isOffline = useOffline();

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const res = await getCurrentDirecto();
        if (active) setOrder(res.order);
      } catch (err) {
        if (!active) return;
        toast.error(
          err instanceof Error ? err.message : "No se pudo cargar la venta."
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

  async function startNew() {
    setCreating(true);
    try {
      const res = await openOrder({ type: "directo" });
      const data = await getOrder(res.order.id);
      setOrder(data.order);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo iniciar la venta."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold">Venta directa</h1>
        <p className="text-sm text-muted-foreground">
          {order
            ? "Venta para llevar o mostrador"
            : "Venta rápida sin mesa asignada"}
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          Cargando…
        </div>
      ) : order ? (
        <OrderEditor
          order={order}
          onChanged={() => {
            void getCurrentDirecto().then((res) => setOrder(res.order));
          }}
          cobroLabel="Cobrar venta"
        />
      ) : (
        <div className="rounded-xl border border-border bg-muted p-10 text-center">
          <ShoppingCart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No tienes una venta directa en curso.
          </p>
          <Button
            className="mt-4"
            size="lg"
            disabled={creating || isOffline}
            title={isOffline ? "Sin conexión" : undefined}
            onClick={() => void startNew()}
          >
            Nueva venta directa
          </Button>
        </div>
      )}
    </div>
  );
}