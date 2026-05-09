import { createContributionPlaceholder, listContributionPlaceholders } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const giftItemId = searchParams.get("giftItemId") ?? undefined;
  return withUser((user) => listContributionPlaceholders(user, giftItemId), { logLabel: "auth-debug", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createContributionPlaceholder(user, body);
  }, { logLabel: "profile-save", request });
}
