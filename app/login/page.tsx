import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm, type LoginUser } from "./login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/auth/session";
import { getRoleHome } from "@/lib/auth/roles";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(getRoleHome(session.role));

  const supabase = getAdminClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, name, role")
    .eq("active", true)
    .order("name");

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <header className="flex flex-col items-center">
        <Image
          className="h-auto w-56 dark:hidden"
          src="/logo/logo-oscuro-fondo-claro.png"
          alt="El Fotógrafo — logo"
          width={224}
          height={96}
          priority
        />
        <Image
          className="h-auto w-56 hidden dark:block"
          src="/logo/logo-claro-fondo-oscuro.png"
          alt="El Fotógrafo — logo"
          width={224}
          height={96}
          priority
        />
        <p className="mt-3 text-center text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Pisco puro de Ica · Desde 1991
        </p>
      </header>

      <LoginForm users={(users ?? []) as LoginUser[]} />
    </main>
  );
}