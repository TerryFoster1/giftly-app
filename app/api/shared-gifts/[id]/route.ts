import { withUser } from "@/lib/api";
import { updateSharedGiftPlan } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return updateSharedGiftPlan(user, params.id, body.action);
  }, { logLabel: "shared-gift", request });
}
