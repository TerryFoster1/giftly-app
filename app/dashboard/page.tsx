import { AppShell } from "@/components/shell";
import { DashboardClient } from "@/components/dashboard-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <DashboardClient />
    </AppShell>
  );
}
