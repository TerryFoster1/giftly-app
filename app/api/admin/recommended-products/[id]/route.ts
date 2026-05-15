import { withUser } from "@/lib/api";
import { deleteRecommendedProduct, upsertRecommendedProduct } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertRecommendedProduct(user, { ...body, id: params.id });
  }, { logLabel: "admin-recommended-product", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => deleteRecommendedProduct(user, params.id), { logLabel: "admin-recommended-product", request });
}
