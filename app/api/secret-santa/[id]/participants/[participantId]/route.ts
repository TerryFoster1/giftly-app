import { withUser } from "@/lib/api";
import { removeSecretSantaParticipant, respondToSecretSanta } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string; participantId: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return respondToSecretSanta(user, params.id, params.participantId, body.status);
  }, { logLabel: "secret-santa-participant", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string; participantId: string } }) {
  return withUser((user) => removeSecretSantaParticipant(user, params.id, params.participantId), { logLabel: "secret-santa-participant", request });
}
