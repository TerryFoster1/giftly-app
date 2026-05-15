import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin-client";
import { AppShell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");

  return (
    <AppShell>
      <AdminClient />
    </AppShell>
  );
}
