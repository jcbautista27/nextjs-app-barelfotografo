"use client";

import { useEffect, useState } from "react";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPEN } from "@/lib/money";

type Product = {
  id: string;
  name: string;
  price: number;
};

async function loadProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "No se pudieron cargar los productos.");
  }
  return (body?.products ?? []).filter((p: Product) => p.price >= 0);
}

export function AddProductDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (productId: string, notes: string | null) => Promise<void>;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const isOffline = useOffline();

  useEffect(() => {
    if (!open) return;
    let active = true;
    loadProducts()
      .then((products) => {
        if (active) setProducts(products);
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
  }, [open]);

  async function add(productId: string) {
    setPendingId(productId);
    try {
      await onAdd(productId, note.trim() || null);
      setNote("");
      setProducts((prev) => prev); // conserva orden
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar producto</DialogTitle>
          <DialogDescription>
            Toca un producto para añadirlo a la cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          <Label htmlFor="item-note">Nota (opcional)</Label>
          <Input
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Ej. sin hielo"
          />
        </div>

        <div className="grid max-h-[50vh] gap-1.5 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Cargando productos…
            </div>
          ) : products.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {isOffline
                ? "Sin conexión — los productos no están disponibles."
                : "No hay productos disponibles."}
            </div>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                disabled={pendingId !== null || isOffline}
                onClick={() => add(product.id)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted px-3 py-2.5 text-left transition-colors hover:bg-muted/70 disabled:opacity-60"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPEN(product.price)}
                  </div>
                </div>
                <Plus className="size-4 shrink-0 text-primary" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}