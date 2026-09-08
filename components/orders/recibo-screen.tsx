"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/money";
import type { Order } from "@/lib/orders";
import { getOrder } from "@/components/orders/order-api";
import { PAYMENT_LABELS } from "@/lib/catalog";
import { BUSINESS_NAME, BUSINESS_SUBTITLE } from "@/lib/business";

function formatMetaDate(iso: string): string {
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

export function ReciboScreen({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrder(orderId)
      .then((res) => {
        if (active) setOrder(res.order);
      })
      .catch((err) => {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Error al cargar.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Cargando recibo…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          El recibo no existe.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <div>
        <h1 className="text-lg font-bold">Recibo</h1>
        <p className="text-sm text-muted-foreground">
          {BUSINESS_NAME} · {BUSINESS_SUBTITLE}
        </p>
      </div>

      {order.status !== "closed" ? (
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          Esta cuenta aún no se ha cobrado.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-dashed border-border bg-muted p-5">
            <div className="mb-4 text-center">
              <div className="text-base font-extrabold tracking-wide">
                {BUSINESS_NAME}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {BUSINESS_SUBTITLE}
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#5B9279]">
                Pagado
              </div>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Fecha</span>
              <span>{formatMetaDate(order.closed_at ?? order.opened_at)}</span>
            </div>
            {order.table_label ? (
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Mesa</span>
                <span>{order.table_label}</span>
              </div>
            ) : null}
            {order.opened_by_name ? (
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Atendido por</span>
                <span>{order.opened_by_name}</span>
              </div>
            ) : null}

            <div className="my-3 border-t border-dashed border-border" />

            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantity} × {formatPEN(item.unit_price)}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </div>
                </div>
                <div className="shrink-0 tabular-nums">
                  {formatPEN(item.quantity * item.unit_price)}
                </div>
              </div>
            ))}

            <div className="my-3 border-t border-dashed border-border" />

            <div className="flex justify-between text-base font-extrabold">
              <span>Total</span>
              <span className="tabular-nums">{formatPEN(order.total)}</span>
            </div>
            {order.payment_method ? (
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-muted-foreground">Método de pago</span>
                <span>{PAYMENT_LABELS[order.payment_method]}</span>
              </div>
            ) : null}
          </div>

          <a
            href={`/api/orders/${order.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full" size="lg">
              <Download /> Descargar PDF
            </Button>
          </a>
        </>
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