import { withUser } from "@/lib/api";
import { upsertAffiliateProgram } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertAffiliateProgram(user, body);
  }, { logLabel: "admin-affiliate-programs", request });
}
