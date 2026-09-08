import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { VentaDirecta } from "@/components/orders/venta-directa";

export const metadata = { title: "Venta directa" };

export default async function VentaDirectaPage() {
  await requireRoleOrRedirect(["owner", "manager", "waiter"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <VentaDirecta />
    </main>
  );
}