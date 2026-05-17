import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SecretSantaNewClient } from "@/components/secret-santa-new-client";
import { getCurrentUser } from "@/lib/auth";

export default async function NewSecretSantaPage() {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <SecretSantaNewClient />
    </AppShell>
  );
}
