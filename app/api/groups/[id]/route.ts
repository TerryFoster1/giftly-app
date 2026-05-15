import { withUser } from "@/lib/api";
import { deleteGiftGroup } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteGiftGroup(user, params.id);
    return { ok: true };
  }, { logLabel: "groups", request });
}
