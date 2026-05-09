import { createManagedProfile, getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET(request: Request) {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.profiles;
  }, { logLabel: "auth-debug", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createManagedProfile(user, body);
  }, { logLabel: "profile-save", request });
}
