import { withUser } from "@/lib/api";
import { shareWishlist } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return shareWishlist(user, body);
  }, { logLabel: "wishlist-share", request });
}
