import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { hashPin, isPinTaken, isValidPin } from "@/lib/auth/pin";
import { getAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/auth/roles";

const ROLES: AppRole[] = ["owner", "manager", "waiter"];

function normalizeUser(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as AppRole,
    active: row.active as boolean,
    created_at: row.created_at as string,
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const patch: Record<string, unknown> = {};

  if ("name" in (body ?? {})) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del usuario es obligatorio." },
        { status: 400 }
      );
    }
    if (name.length > 60) {
      return NextResponse.json(
        { error: "El nombre es demasiado largo." },
        { status: 400 }
      );
    }
    patch.name = name;
  }

  if ("role" in (body ?? {})) {
    if (!body.role || !ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    patch.role = body.role;
  }

  if ("active" in (body ?? {})) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json(
        { error: "El estado activo debe ser verdadero o falso." },
        { status: 400 }
      );
    }
    patch.active = body.active;
  }

  if ("pin" in (body ?? {})) {
    if (!isValidPin(body.pin)) {
      return NextResponse.json(
        { error: "El PIN debe tener entre 4 y 6 dígitos." },
        { status: 400 }
      );
    }
    if (await isPinTaken(body.pin, id)) {
      return NextResponse.json(
        { error: "Ese PIN ya lo usa otro usuario. Elige otro." },
        { status: 409 }
      );
    }
    patch.pin_hash = await hashPin(body.pin);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .select("id, name, role, active, created_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo actualizar el usuario." },
      { status: 500 }
    );
  }
  return NextResponse.json({ user: normalizeUser(data) });
}