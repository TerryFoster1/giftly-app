import { withUser } from "@/lib/api";
import { resetUserGiftlyData } from "@/lib/db";

export async function POST(request: Request) {
  return withUser((user) => resetUserGiftlyData(user), { logLabel: "profile-save", request });
}
