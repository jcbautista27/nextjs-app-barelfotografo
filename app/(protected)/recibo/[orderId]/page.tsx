import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { ReciboScreen } from "@/components/orders/recibo-screen";

export const metadata = { title: "Recibo" };

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRoleOrRedirect(["owner", "manager", "waiter"]);
  const { orderId } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <ReciboScreen orderId={orderId} />
    </main>
  );
}