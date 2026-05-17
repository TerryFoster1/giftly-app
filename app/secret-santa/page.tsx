import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SecretSantaListClient } from "@/components/secret-santa-list-client";
import { getCurrentUser } from "@/lib/auth";

export default async function SecretSantaPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <SecretSantaListClient />
    </AppShell>
  );
}
