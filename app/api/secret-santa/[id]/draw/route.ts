import { withUser } from "@/lib/api";
import { resetSecretSantaDraw, runSecretSantaDraw } from "@/lib/secret-santa-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => runSecretSantaDraw(user, params.id), { logLabel: "secret-santa-draw", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => resetSecretSantaDraw(user, params.id), { logLabel: "secret-santa-draw", request });
}
