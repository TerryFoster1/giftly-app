import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SecretSantaEventClient } from "@/components/secret-santa-event-client";
import { getCurrentUser } from "@/lib/auth";

export default async function SecretSantaEventPage({ params }: { params: { id: string } }) {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <SecretSantaEventClient eventId={params.id} />
    </AppShell>
  );
}
