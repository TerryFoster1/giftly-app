import { withUser } from "@/lib/api";
import { createSecretSantaEvent, listSecretSantaEvents } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withUser((user) => listSecretSantaEvents(user), { logLabel: "secret-santa", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createSecretSantaEvent(user, body);
  }, { logLabel: "secret-santa", request });
}
