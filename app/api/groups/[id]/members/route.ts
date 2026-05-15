import { withUser } from "@/lib/api";
import { addConnectionToGroup } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return addConnectionToGroup(user, { ...body, groupId: params.id });
  }, { logLabel: "group-members", request });
}
