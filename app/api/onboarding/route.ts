import { withUser } from "@/lib/api";
import { completeOnboarding } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withUser((user) => completeOnboarding(user), { logLabel: "onboarding-save", request });
}
