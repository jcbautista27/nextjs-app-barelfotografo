import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { CobroScreen } from "@/components/orders/cobro-screen";

export const metadata = { title: "Cobro" };

export default async function CobroPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requireRoleOrRedirect(["owner", "manager", "waiter"]);
  const { orderId } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <CobroScreen orderId={orderId} />
    </main>
  );
}