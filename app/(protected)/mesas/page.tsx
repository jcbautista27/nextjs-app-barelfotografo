import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { MesasGrid } from "@/components/orders/mesas-grid";

export const metadata = { title: "Mesas" };

export default async function MesasPage() {
  await requireRoleOrRedirect(["owner", "manager", "waiter"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <MesasGrid />
    </main>
  );
}