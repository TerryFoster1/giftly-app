import { withUser } from "@/lib/api";
import { getSecretSantaInvite, joinSecretSantaByToken } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { token: string } }) {
  return withUser((user) => getSecretSantaInvite(user, params.token), { logLabel: "secret-santa-invite", request });
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  return withUser(async (user) => {
    const body = await request.json().catch(() => ({}));
    return joinSecretSantaByToken(user, params.token, body.status ?? "accepted");
  }, { logLabel: "secret-santa-invite", request });
}
