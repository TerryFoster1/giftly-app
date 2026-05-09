import { getOwnerStore, upsertGift } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET(request: Request) {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.gifts;
  }, { logLabel: "auth-debug", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertGift(user, body);
  }, { logLabel: "gift-save", request });
}
