import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRoleHome } from "@/lib/auth/roles";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(getRoleHome(session.role));
}