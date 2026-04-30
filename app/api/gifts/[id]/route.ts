import { NextResponse } from "next/server";
import { deleteGift, upsertGift } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function PUT(request: Request) {
  const body = await request.json();
  return withUser((user) => upsertGift(user, body));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteGift(user, params.id);
    return { ok: true };
  });
}
