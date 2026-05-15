import { getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withUser((user) => getOwnerStore(user), { logLabel: "auth-debug", request });
}
