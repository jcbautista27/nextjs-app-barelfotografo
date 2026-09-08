"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/roles";

type NavItem = { href: string; label: string; roles: AppRole[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/mesas", label: "Mesas", roles: ["owner", "manager", "waiter"] },
  {
    href: "/venta-directa",
    label: "Venta directa",
    roles: ["owner", "manager", "waiter"],
  },
  { href: "/productos", label: "Productos", roles: ["owner", "manager"] },
  {
    href: "/mesas/configuracion",
    label: "Mesas · Config",
    roles: ["owner", "manager"],
  },
  { href: "/usuarios", label: "Usuarios", roles: ["owner", "manager"] },
  { href: "/reportes", label: "Reportes", roles: ["owner", "manager"] },
];

export function AppNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function isActive(item: NavItem): boolean {
    if (item.href === "/mesas") {
      return (
        pathname === "/mesas" ||
        (pathname.startsWith("/mesas/") &&
          !pathname.startsWith("/mesas/configuracion"))
      );
    }
    return (
      pathname === item.href || pathname.startsWith(item.href + "/")
    );
  }

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}