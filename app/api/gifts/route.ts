import { NextResponse } from "next/server";
import { getOwnerStore, upsertGift } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.gifts;
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withUser((user) => upsertGift(user, body));
}
