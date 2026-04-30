import { withUser } from "@/lib/api";
import { deleteProfile, updatePrimaryProfileVanitySlug, updateProfileEvents } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  return withUser((user) => {
    if (typeof body.slug === "string") return updatePrimaryProfileVanitySlug(user, params.id, body.slug);
    return updateProfileEvents(user, params.id, {
      birthday: body.birthday,
      anniversary: body.anniversary
    });
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteProfile(user, params.id);
    return { ok: true };
  });
}
