import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { HistorialScreen } from "@/components/admin/historial-screen";

export const metadata = { title: "Historial" };

export default async function HistorialPage() {
  await requireRoleOrRedirect(["owner", "manager"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <HistorialScreen />
    </main>
  );
}