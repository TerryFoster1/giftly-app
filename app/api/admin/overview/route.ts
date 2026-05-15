import { withUser } from "@/lib/api";
import { getAdminOverview } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withUser((user) => getAdminOverview(user), { logLabel: "admin-overview", request });
}
