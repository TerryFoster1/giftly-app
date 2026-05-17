import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SecretSantaAssignmentClient } from "@/components/secret-santa-assignment-client";
import { getCurrentUser } from "@/lib/auth";

export default async function SecretSantaAssignmentPage({ params }: { params: { id: string } }) {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <SecretSantaAssignmentClient eventId={params.id} />
    </AppShell>
  );
}
