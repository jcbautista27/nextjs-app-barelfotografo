import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { MesaDetail } from "@/components/orders/mesa-detail";

export const metadata = { title: "Mesa" };

export default async function MesaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRoleOrRedirect(["owner", "manager", "waiter"]);
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <MesaDetail tableId={id} />
    </main>
  );
}