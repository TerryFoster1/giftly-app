import { withUser } from "@/lib/api";
import { createGiftGroup, getOwnerStore } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.groups;
  }, { logLabel: "groups", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createGiftGroup(user, body);
  }, { logLabel: "groups", request });
}
