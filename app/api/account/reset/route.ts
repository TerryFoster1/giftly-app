import { withUser } from "@/lib/api";
import { resetUserGiftlyData } from "@/lib/db";

export async function POST() {
  return withUser((user) => resetUserGiftlyData(user));
}
