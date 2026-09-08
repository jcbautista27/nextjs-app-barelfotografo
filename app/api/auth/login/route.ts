import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { getRoleHome } from "@/lib/auth/roles";
import { getAdminClient } from "@/lib/supabase/admin";

const GENERIC_ERROR = "PIN incorrecto. Inténtalo de nuevo.";

// Hash "dummy" para que un PIN erróneo tarde lo mismo aunque el usuario no exista.
const DUMMY_HASH = bcrypt.hashSync("dummy-pin", 10);

function fail() {
  return NextResponse.json(
    { ok: false, error: GENERIC_ERROR },
    { status: 401 }
  );
}

export async function POST(request: Request) {
  let userId: unknown;
  let pin: unknown;

  try {
    const body = await request.json();
    userId = body?.userId;
    pin = body?.pin;
  } catch {
    return fail();
  }

  if (
    typeof userId !== "string" ||
    typeof pin !== "string" ||
    !/^\d{4,6}$/.test(pin)
  ) {
    return fail();
  }

  const supabase = getAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, name, role, pin_hash")
    .eq("id", userId)
    .eq("active", true)
    .maybeSingle();

  const pinValid = user
    ? await bcrypt.compare(pin, user.pin_hash)
    : await bcrypt.compare(pin, DUMMY_HASH);

  if (!user || !pinValid) {
    return fail();
  }

  await createSession({ userId: user.id, name: user.name, role: user.role });

  return NextResponse.json({
    ok: true,
    redirect: getRoleHome(user.role),
  });
}