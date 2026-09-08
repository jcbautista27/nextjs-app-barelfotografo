import "server-only";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase/admin";

const BCRYPT_ROUNDS = 10;

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{4,6}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

/**
 * Verifica si un PIN ya está en uso por otro usuario.
 * Los hashes son bcrypt (salted), así que la comparación es contra cada hash
 * con bcrypt.compare (número de usuarios pequeño, costo despreciable).
 */
export async function isPinTaken(
  pin: string,
  excludeUserId?: string
): Promise<boolean> {
  const supabase = getAdminClient();
  const { data } = await supabase.from("users").select("id, pin_hash");
  if (!data) return false;
  for (const user of data) {
    if (excludeUserId && user.id === excludeUserId) continue;
    if (user.pin_hash && (await bcrypt.compare(pin, user.pin_hash))) {
      return true;
    }
  }
  return false;
}