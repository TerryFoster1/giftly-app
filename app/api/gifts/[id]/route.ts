import { deleteGift, upsertGift } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function PUT(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertGift(user, body);
  }, { logLabel: "gift-save" });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteGift(user, params.id);
    return { ok: true };
  });
}
