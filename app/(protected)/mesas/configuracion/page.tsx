import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { MesasConfigAdmin } from "@/components/admin/mesas-config-admin";

export const metadata = { title: "Configuración de mesas" };

export default async function MesasConfiguracionPage() {
  await requireRoleOrRedirect(["owner", "manager"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <MesasConfigAdmin />
    </main>
  );
}