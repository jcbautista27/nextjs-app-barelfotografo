export type AppRole = "owner" | "manager" | "waiter";

/** Página de inicio según el rol, tal como define la especificación técnica. */
export function getRoleHome(role: AppRole): string {
  if (role === "waiter") return "/mesas";
  return "/reportes";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "owner":
      return "Dueño";
    case "manager":
      return "Encargado";
    case "waiter":
      return "Mesero";
  }
}