import { withUser } from "@/lib/api";
import { createPendingConnection, getOwnerStore } from "@/lib/db";

export async function GET() {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.connections;
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withUser((user) => createPendingConnection(user, body));
}
