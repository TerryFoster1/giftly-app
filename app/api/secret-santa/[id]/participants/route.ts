import { withUser } from "@/lib/api";
import { addSecretSantaParticipant } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return addSecretSantaParticipant(user, params.id, body);
  }, { logLabel: "secret-santa-participant", request });
}
