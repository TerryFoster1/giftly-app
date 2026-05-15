import { withUser } from "@/lib/api";
import { addConnectionToGroup, removeConnectionFromGroup } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return addConnectionToGroup(user, { ...body, groupId: params.id });
  }, { logLabel: "group-members", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) throw new Error("INVALID_GROUP_MEMBER");
    await removeConnectionFromGroup(user, params.id, memberId);
    return { ok: true };
  }, { logLabel: "group-members", request });
}
