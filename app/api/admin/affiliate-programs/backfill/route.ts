import { withUser } from "@/lib/api";
import { backfillAmazonAffiliateUrls } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withUser((user) => backfillAmazonAffiliateUrls(user), { logLabel: "admin-affiliate-backfill", request });
}
