import { withUser } from "@/lib/api";
import { deleteConnection } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteConnection(user, params.id);
    return { ok: true };
  }, { logLabel: "connection-delete", request });
}
