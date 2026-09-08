import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { UsuariosAdmin } from "@/components/admin/usuarios-admin";

export const metadata = { title: "Usuarios" };

export default async function UsuariosPage() {
  await requireRoleOrRedirect(["owner", "manager"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <UsuariosAdmin />
    </main>
  );
}