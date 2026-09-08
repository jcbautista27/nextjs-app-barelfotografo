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

export async function GET() {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, role, active, created_at")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron cargar los usuarios." },
      { status: 500 }
    );
  }
  return NextResponse.json({ users: (data ?? []).map(normalizeUser) });
}

export async function POST(request: Request) {
  const auth = await requireRole(["owner", "manager"]);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const role = body?.role;
  const pin = body?.pin;

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
  if (!role || !ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }
  if (!isValidPin(pin)) {
    return NextResponse.json(
      { error: "El PIN debe tener entre 4 y 6 dígitos." },
      { status: 400 }
    );
  }
  if (await isPinTaken(pin)) {
    return NextResponse.json(
      { error: "Ese PIN ya lo usa otro usuario. Elige otro." },
      { status: 409 }
    );
  }

  const pinHash = await hashPin(pin);

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .insert({ name, role, pin_hash: pinHash })
    .select("id, name, role, active, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear el usuario." },
      { status: 500 }
    );
  }
  return NextResponse.json({ user: normalizeUser(data) }, { status: 201 });
}