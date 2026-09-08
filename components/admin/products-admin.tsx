"use client";

import { useCallback, useEffect, useState } from "react";
import { useOffline } from "next/offline";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from "@/lib/catalog";
import { formatPEN } from "@/lib/money";
import type { ProductCategory } from "@/lib/catalog";

type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  active: boolean;
};

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Ocurrió un error. Intenta de nuevo.");
  }
  return body;
}

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("licor");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const isOffline = useOffline();

  const load = useCallback(() => {
    return api("/api/products")
      .then((data) => setProducts(data.products ?? []))
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Error al cargar.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setName("");
    setCategory("licor");
    setPrice("");
    setOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setOpen(true);
  }

  async function save() {
    const trimmed = name.trim();
    const numericPrice = Number(price);
    if (!trimmed) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      toast.error("Ingresa un precio válido (mayor o igual a 0).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmed,
        category,
        price: numericPrice,
      };
      if (editing) {
        await api(`/api/products/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Producto actualizado.");
      } else {
        await api("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Producto creado.");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    try {
      await api(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      toast.success(
        product.active ? "Producto desactivado." : "Producto reactivado."
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  const badgeVariant = (p: Product) => (p.active ? "secondary" : "outline");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo del negocio. Desactivar un producto lo oculta de la toma
            de pedidos sin borrar el historial.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Nuevo producto
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Cargando productos…
          </div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aún no hay productos. Crea el primero con &quot;Nuevo producto&quot;.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {product.name}
                  </span>
                  <Badge variant={badgeVariant(product)}>
                    {product.active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[product.category]} · {formatPEN(product.price)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={product.active}
                  onCheckedChange={() => toggleActive(product)}
                  disabled={isOffline}
                  aria-label={`Activar o desactivar ${product.name}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isOffline}
                  onClick={() => openEdit(product)}
                  aria-label={`Editar ${product.name}`}
                >
                  <Pencil /> Editar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del producto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="product-name">Nombre</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Pisco Puro El Fotógrafo"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Categoría</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as ProductCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="product-price">Precio (S/)</Label>
              <Input
                id="product-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || isOffline}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}