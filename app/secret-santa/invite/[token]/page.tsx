import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SecretSantaInviteClient } from "@/components/secret-santa-invite-client";
import { getCurrentUser } from "@/lib/auth";

export default async function SecretSantaInvitePage({ params }: { params: { token: string } }) {
  if (!(await getCurrentUser())) redirect(`/login?next=/secret-santa/invite/${params.token}`);

  return (
    <AppShell>
      <SecretSantaInviteClient token={params.token} />
    </AppShell>
  );
}
