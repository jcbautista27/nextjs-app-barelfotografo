import { SignJWT, jwtVerify } from "jose";
import type { AppRole } from "@/lib/auth/roles";

export const SESSION_COOKIE = "ef_session";
export const SESSION_DURATION_SECONDS = 12 * 60 * 60;

export type SessionUser = {
  userId: string;
  name: string;
  role: AppRole;
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta la variable de entorno SESSION_SECRET.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const role = payload.role;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      (role !== "owner" && role !== "manager" && role !== "waiter")
    ) {
      return null;
    }
    return { userId: payload.sub, name: payload.name, role };
  } catch {
    return null;
  }
}