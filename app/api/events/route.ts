import { withUser } from "@/lib/api";
import { createGiftEvent } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return createGiftEvent(user, body);
  }, { logLabel: "event-save", request });
}
