import { withUser } from "@/lib/api";
import { getMySecretSantaAssignment } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => getMySecretSantaAssignment(user, params.id), { logLabel: "secret-santa-assignment", request });
}
