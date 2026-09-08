// Seed del usuario inicial (owner) para poder probar el login (Etapa 1).
// Uso: npm run seed:owner   (por defecto PIN 1234; override con SEED_PIN=xxxx)
// Idempotente: si ya existe un usuario llamado "Dueño", no crea duplicados.
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pin = process.env.SEED_PIN || "1234";

if (!url || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  process.exit(1);
}
if (!/^\d{4,6}$/.test(pin)) {
  console.error("SEED_PIN debe tener entre 4 y 6 dígitos.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing, error: selError } = await supabase
  .from("users")
  .select("id, name")
  .eq("name", "Dueño")
  .maybeSingle();

if (selError) {
  console.error("Error consultando usuarios:", selError.message);
  process.exit(1);
}
if (existing) {
  console.log(`El usuario "${existing.name}" ya existe (id=${existing.id}). No se creó nada.`);
  process.exit(0);
}

const pinHash = bcrypt.hashSync(pin, 10);

const { data, error } = await supabase
  .from("users")
  .insert({ name: "Dueño", role: "owner", pin_hash: pinHash })
  .select("id, name, role, active")
  .single();

if (error) {
  console.error("Error creando el usuario seed:", error.message);
  process.exit(1);
}

console.log("Usuario seed creado:", data);
console.log(`PIN de acceso inicial: ${pin}  (cámbialo luego desde /usuarios)`);