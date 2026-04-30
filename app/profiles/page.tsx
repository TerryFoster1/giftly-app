import { AppShell } from "@/components/shell";
import { ProfilesClient } from "@/components/profiles-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilesPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <ProfilesClient />
    </AppShell>
  );
}
