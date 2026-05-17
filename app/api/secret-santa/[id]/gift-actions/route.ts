import { withUser } from "@/lib/api";
import { saveSecretSantaGiftAction } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return saveSecretSantaGiftAction(user, params.id, body);
  }, { logLabel: "secret-santa-gift-action", request });
}
