import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return <AdminShell user={session} />;
}
