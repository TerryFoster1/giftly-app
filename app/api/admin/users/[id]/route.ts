import { withUser } from "@/lib/api";
import { deleteAdminUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser((user) => deleteAdminUser(user, params.id), { logLabel: "admin-user-delete", request });
}
