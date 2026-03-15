import { redirect } from "next/navigation";
import { canAccessAdminPage } from "@/app/actions/admin-users";
import AdminPageClient from "./AdminPageClient";

export default async function AdminPage() {
  const allowed = await canAccessAdminPage();
  if (!allowed) {
    redirect("/dashboard");
  }
  return <AdminPageClient />;
}
