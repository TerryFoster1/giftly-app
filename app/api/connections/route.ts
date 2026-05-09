import { withUser } from "@/lib/api";
import { createPendingConnection, getOwnerStore } from "@/lib/db";

export async function GET(request: Request) {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.connections;
  }, { logLabel: "auth-debug", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createPendingConnection(user, body);
  }, { logLabel: "profile-save", request });
}
