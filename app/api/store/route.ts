import { getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET(request: Request) {
  return withUser((user) => getOwnerStore(user), { logLabel: "auth-debug", request });
}
