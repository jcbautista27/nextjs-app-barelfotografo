import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/auth/session";
import { roleLabel, type AppRole } from "@/lib/auth/roles";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight">
              El Fotógrafo
            </span>
            <span className="text-sm text-muted-foreground">
              {session.name}
              <span className="mx-1 text-muted-foreground/50">·</span>
              {roleLabel(session.role as AppRole)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
        <AppNav role={session.role as AppRole} />
      </header>
      <div className="flex-1">{children}</div>
      <Toaster position="top-center" />
    </div>
  );
}