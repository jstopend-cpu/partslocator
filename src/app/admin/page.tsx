import { redirect } from "next/navigation";
import { canAccessAdminPage, getCurrentAdminRole } from "@/app/actions/admin-users";
import AdminPageClient from "./AdminPageClient";

export default async function AdminPage() {
  const allowed = await canAccessAdminPage();
  if (!allowed) redirect("/dashboard");
  const currentRole = await getCurrentAdminRole();
  return <AdminPageClient currentRole={currentRole} />;
}
