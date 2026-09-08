import { requireRoleOrRedirect } from "@/lib/auth/guard";
import { ProductsAdmin } from "@/components/admin/products-admin";

export const metadata = { title: "Productos" };

export default async function ProductosPage() {
  await requireRoleOrRedirect(["owner", "manager"]);
  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <ProductsAdmin />
    </main>
  );
}