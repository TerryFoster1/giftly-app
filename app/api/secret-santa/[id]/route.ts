import { withUser } from "@/lib/api";
import { getSecretSantaEvent } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => getSecretSantaEvent(user, params.id), { logLabel: "secret-santa", request });
}
