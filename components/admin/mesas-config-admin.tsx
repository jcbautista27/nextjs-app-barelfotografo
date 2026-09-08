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

type Table = {
  id: string;
  label: string;
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

export function MesasConfigAdmin() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const isOffline = useOffline();

  const load = useCallback(() => {
    return api("/api/tables")
      .then((data) => setTables(data.tables ?? []))
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
    setLabel("");
    setOpen(true);
  }

  function openEdit(table: Table) {
    setEditing(table);
    setLabel(table.label);
    setOpen(true);
  }

  async function save() {
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("El nombre de la mesa es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = { label: trimmed };
      if (editing) {
        await api(`/api/tables/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Mesa actualizada.");
      } else {
        await api("/api/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Mesa creada.");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(table: Table) {
    try {
      await api(`/api/tables/${table.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !table.active }),
      });
      toast.success(table.active ? "Mesa desactivada." : "Mesa reactivada.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Configuración de mesas</h1>
          <p className="text-sm text-muted-foreground">
            Define cuántas mesas tiene el local. Las mesas desactivadas no se
            muestran para tomar pedidos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Nueva mesa
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Cargando mesas…
          </div>
        ) : tables.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aún no hay mesas. Crea la primera con &quot;Nueva mesa&quot;.
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {table.label}
                  </span>
                  <Badge variant={table.active ? "secondary" : "outline"}>
                    {table.active ? "Activa" : "Desactivada"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={table.active}
                  onCheckedChange={() => toggleActive(table)}
                  disabled={isOffline}
                  aria-label={`Activar o desactivar ${table.label}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isOffline}
                  onClick={() => openEdit(table)}
                  aria-label={`Renombrar ${table.label}`}
                >
                  <Pencil /> Renombrar
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
            <DialogTitle>{editing ? "Renombrar mesa" : "Nueva mesa"}</DialogTitle>
            <DialogDescription>
              El nombre aparecerá en el mapa de mesas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="table-label">Nombre de la mesa</Label>
            <Input
              id="table-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Mesa 1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !saving) void save();
              }}
            />
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