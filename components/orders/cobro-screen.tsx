"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/money";
import { computeLineSubtotal } from "@/lib/orders";
import type { Order } from "@/lib/orders";
import type { PaymentMethod } from "@/components/orders/order-api";
import { PAYMENT_LABELS } from "@/lib/catalog";
import { getOrder, closeOrder } from "@/components/orders/order-api";
import { BUSINESS_NAME } from "@/lib/business";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const METHODS: PaymentMethod[] = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "otro",
];

export function CobroScreen({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [closing, setClosing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOffline = useOffline();

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

  function requestConfirm() {
    if (!method) {
      toast.error("Selecciona un método de pago.");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirm() {
    if (!method) {
      toast.error("Selecciona un método de pago.");
      return;
    }
    setClosing(true);
    try {
      const res = await closeOrder(orderId, method);
      toast.success("Cuenta cobrada correctamente.");
      router.push(`/recibo/${res.order?.id ?? orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cobrar.");
      const reload = await getOrder(orderId).catch(() => null);
      const status = reload?.order?.status;
      if (status && status !== "open") router.replace(`/recibo/${orderId}`);
      setClosing(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-muted-foreground">
        Cargando cuenta…
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-xl border border-border p-10 text-center text-sm text-muted-foreground">
          La cuenta no existe.
        </div>
      </div>
    );
  }

  if (order.status === "closed") {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted p-10 text-center">
          <CheckCircle2 className="size-10 text-[#5B9279]" />
          <h1 className="text-lg font-bold">Cuenta ya pagada</h1>
          <p className="text-sm text-muted-foreground">
            Esta cuenta ya fue cobrada. Puedes ver o descargar su recibo.
          </p>
          <Button size="lg" nativeButton={false} render={<Link href={`/recibo/${order.id}`} />}>
            Ver recibo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackLink />

      <div>
        <h1 className="text-lg font-bold">
          Cobrar {order.table_label ?? "venta directa"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Selecciona el método de pago
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-xl border px-4 py-4 text-center text-sm font-semibold transition-colors ${
              method === m
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted hover:bg-muted/70"
            }`}
          >
            {PAYMENT_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted p-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between text-sm py-1"
          >
            <span className="text-muted-foreground">
              {item.name} ×{item.quantity}
            </span>
            <span>
              {formatPEN(computeLineSubtotal(item.quantity, item.unit_price))}
            </span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-border pt-3 text-base font-extrabold">
          <span>Total</span>
          <span className="tabular-nums">{formatPEN(order.total)}</span>
        </div>
      </div>

      <Button
        className="w-full py-4 text-sm"
        size="lg"
        disabled={closing || isOffline}
        onClick={() => void requestConfirm()}
      >
        {closing
          ? "Procesando…"
          : isOffline
            ? "Sin conexión"
            : "Confirmar cobro"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Al confirmar, la cuenta se cierra y la mesa queda libre nuevamente.
        Estás cobrando en {BUSINESS_NAME}.
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Seguro que deseas cobrar esta cuenta?</DialogTitle>
            <DialogDescription>
              La cuenta se cerrará y ya no podrás modificar sus productos ni
              volver a cobrarla.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Método de pago</span>
              <span className="font-medium">
                {method ? PAYMENT_LABELS[method] : "—"}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Total a cobrar</span>
              <span className="text-base font-extrabold tabular-nums">
                {formatPEN(order?.total ?? 0)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={closing}
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button disabled={closing} onClick={() => void confirm()}>
              {closing ? "Cobrando…" : "Sí, cobrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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