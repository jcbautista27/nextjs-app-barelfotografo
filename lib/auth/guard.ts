import "server-only";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRoleHome, type AppRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/token";

type GuardResult =
  | { session: SessionUser; error: null }
  | { session: null; error: NextResponse };

const UNAUTHORIZED = "Debes iniciar sesión para continuar.";
const FORBIDDEN = "No tienes permisos para realizar esta acción.";

/** Exige una sesión válida (cualquier rol). Para route handlers. */
export async function requireAuth(): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: UNAUTHORIZED }, { status: 401 }),
    };
  }
  return { session, error: null };
}

/** Exige una sesión con uno de los roles dados. Para route handlers. */
export async function requireRole(
  roles: AppRole[]
): Promise<GuardResult> {
  const base = await requireAuth();
  if (base.error) return base;
  if (!roles.includes(base.session.role)) {
    return {
      session: null,
      error: NextResponse.json({ error: FORBIDDEN }, { status: 403 }),
    };
  }
  return base;
}

/** Para páginas: redirige a /login si no hay sesión. */
export async function getSessionOrRedirect(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Para páginas: redirige a /login o a la home del rol si no se permite el rol. */
export async function requireRoleOrRedirect(
  roles: AppRole[]
): Promise<SessionUser> {
  const session = await getSessionOrRedirect();
  if (!roles.includes(session.role)) redirect(getRoleHome(session.role));
  return session;
}