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
import { roleLabel, type AppRole } from "@/lib/auth/roles";

type User = {
  id: string;
  name: string;
  role: AppRole;
  active: boolean;
};

const ROLES: AppRole[] = ["owner", "manager", "waiter"];

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? "Ocurrió un error. Intenta de nuevo.");
  }
  return body;
}

export function UsuariosAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("waiter");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const isOffline = useOffline();

  const load = useCallback(() => {
    return api("/api/users")
      .then((data) => setUsers(data.users ?? []))
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
    setRole("waiter");
    setPin("");
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditing(user);
    setName(user.name);
    setRole(user.role);
    setPin("");
    setOpen(true);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!editing && !/^\d{4,6}$/.test(pin)) {
      toast.error("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }
    if (pin && !/^\d{4,6}$/.test(pin)) {
      toast.error("El PIN debe tener entre 4 y 6 dígitos.");
      return;
    }

    const payload: Record<string, unknown> = { name: trimmed, role };
    if (pin) payload.pin = pin;

    setSaving(true);
    try {
      if (editing) {
        await api(`/api/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Usuario actualizado.");
      } else {
        await api("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Usuario creado.");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: User) {
    try {
      await api(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      toast.success(
        user.active ? "Usuario desactivado." : "Usuario reactivado."
      );
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar.");
    }
  }

  const roleVariant: Record<AppRole, "default" | "secondary" | "outline"> = {
    owner: "default",
    manager: "secondary",
    waiter: "outline",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Personas que pueden iniciar sesión. Cada usuario tiene su propio
            PIN de 4 a 6 dígitos (no debe repetirse).
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus /> Nuevo usuario
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aún no hay usuarios.
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <Badge variant={user.active ? roleVariant[user.role] : "outline"}>
                    {roleLabel(user.role)}
                  </Badge>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {user.active ? "Activo" : "Desactivado"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.active}
                  onCheckedChange={() => toggleActive(user)}
                  disabled={isOffline}
                  aria-label={`Activar o desactivar ${user.name}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isOffline}
                  onClick={() => openEdit(user)}
                  aria-label={`Editar ${user.name}`}
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
            <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Actualiza los datos del usuario. Deja el PIN en blanco para conservarlo."
                : "Define el nombre, el rol y un PIN de acceso."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">Nombre</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Jorge"
                autoFocus
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Rol</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as AppRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="user-pin">
                PIN ({editing ? "nuevo, opcional" : "acceso"})
              </Label>
              <Input
                id="user-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/[^\d]/g, "").slice(0, 6))
                }
                placeholder={editing ? "••••••" : "4 a 6 dígitos"}
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