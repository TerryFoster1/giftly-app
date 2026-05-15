import { withUser } from "@/lib/api";
import { userHasAdminAccess } from "@/lib/auth";
import { listActiveRecommendedProducts, upsertRecommendedProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withUser(async (user) => {
    if (!userHasAdminAccess(user)) throw new Error("FORBIDDEN");
    return listActiveRecommendedProducts();
  }, { logLabel: "admin-recommended-products", request });
}

export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertRecommendedProduct(user, body);
  }, { logLabel: "admin-recommended-products", request });
}
