import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin-client";
import { AppShell } from "@/components/shell";
import { getCurrentUser, userHasAdminAccess } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!userHasAdminAccess(user)) redirect("/dashboard");

  return (
    <AppShell>
      <AdminClient />
    </AppShell>
  );
}
