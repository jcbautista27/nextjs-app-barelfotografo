import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { ReportesScreen } from "@/components/admin/reportes-screen";

export const metadata = { title: "Reportes" };

export default async function ReportesPage() {
  await requireRoleOrRedirect(["owner", "manager"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <ReportesScreen />
    </main>
  );
}