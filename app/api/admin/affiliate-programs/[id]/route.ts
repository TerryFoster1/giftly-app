import { withUser } from "@/lib/api";
import { deleteAffiliateProgram, upsertAffiliateProgram } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    return upsertAffiliateProgram(user, { ...body, id: params.id });
  }, { logLabel: "admin-affiliate-program", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => deleteAffiliateProgram(user, params.id), { logLabel: "admin-affiliate-program", request });
}
