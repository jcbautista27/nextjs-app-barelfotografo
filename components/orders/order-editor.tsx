"use client";

import { useState } from "react";
import Link from "next/link";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/money";
import { computeLineSubtotal } from "@/lib/orders";
import type { Order } from "@/lib/orders";
import { addItem, updateItem, removeItem } from "@/components/orders/order-api";
import { AddProductDialog } from "@/components/orders/add-product-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function OrderEditor({
  order,
  onChanged,
  cobroLabel,
}: {
  order: Order;
  onChanged: () => void;
  cobroLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const isOffline = useOffline();

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo completar.");
    } finally {
      setBusy(false);
    }
  }

  function increment(itemId: string, quantity: number) {
    void mutate(() => updateItem(order.id, itemId, { quantity }));
  }

  function decrement(itemId: string, quantity: number) {
    if (quantity <= 1) {
      removeLine(itemId);
      return;
    }
    void mutate(() => updateItem(order.id, itemId, { quantity: quantity - 1 }));
  }

  function removeLine(itemId: string) {
    if (order.items.length === 1) {
      setPendingRemoveId(itemId);
      return;
    }
    void mutate(() => removeItem(order.id, itemId));
  }

  function confirmRemoveLine() {
    const itemId = pendingRemoveId;
    if (!itemId) return;
    setPendingRemoveId(null);
    void mutate(() => removeItem(order.id, itemId));
  }

  function handleAdd(productId: string, notes: string | null) {
    return addItem(order.id, { product_id: productId, quantity: 1, notes }).then(
      () => onChanged()
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="divide-y divide-border rounded-xl border border-border p-2">
        {order.items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            La cuenta está vacía. Agrega el primer producto.
          </div>
        ) : (
          order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-2 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{item.name}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  <span>{formatPEN(item.unit_price)} c/u</span>
                  {item.notes ? <span>· {item.notes}</span> : null}
                </div>
              </div>

              <div className="text-right text-sm font-semibold">
                {formatPEN(computeLineSubtotal(item.quantity, item.unit_price))}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Quitar una unidad de ${item.name}`}
                  disabled={busy || isOffline}
                  onClick={() => decrement(item.id, item.quantity)}
                >
                  <Minus />
                </Button>
                <span className="w-7 text-center text-sm font-semibold tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Agregar una unidad de ${item.name}`}
                  disabled={busy || isOffline}
                  onClick={() => increment(item.id, item.quantity + 1)}
                >
                  <Plus />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Quitar ${item.name} de la cuenta`}
                disabled={busy || isOffline}
                className="text-destructive hover:text-destructive"
                onClick={() => removeLine(item.id)}
              >
                <Trash2 />
              </Button>
            </div>
          ))
        )}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed"
        disabled={busy || isOffline}
        onClick={() => setDialogOpen(true)}
      >
        <Plus /> Agregar producto
      </Button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-extrabold tabular-nums">
              {formatPEN(order.total)}
            </div>
          </div>
          <Button
            size="lg"
            disabled={order.items.length === 0 || isOffline}
            title={isOffline ? "Sin conexión" : undefined}
            nativeButton={false}
            render={<Link href={`/cobro/${order.id}`} />}
          >
            {cobroLabel}
          </Button>
        </div>
      </div>

      <AddProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
      />

      <Dialog
        open={pendingRemoveId !== null}
        onOpenChange={(next) => {
          if (!next) setPendingRemoveId(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Quitar el último producto?</DialogTitle>
            <DialogDescription>
              La cuenta quedará vacía. Podrás agregar productos de nuevo
              cuando lo necesites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setPendingRemoveId(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={() => void confirmRemoveLine()}
            >
              Sí, quitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}