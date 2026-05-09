import { withUser } from "@/lib/api";
import { deleteProfile, updatePrimaryProfileVanitySlug, updateProfileEvents } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    const body = await request.json();
    if (typeof body.slug === "string") {
      try {
        return await updatePrimaryProfileVanitySlug(user, params.id, body.slug);
      } catch (error) {
        console.error("[vanity-save] Request error", {
          userId: user.id,
          profileId: params.id,
          message: error instanceof Error ? error.message : "Unknown error"
        });
        throw error;
      }
    }

    try {
      return await updateProfileEvents(user, params.id, {
        birthday: body.birthday,
        anniversary: body.anniversary
      });
    } catch (error) {
      console.error("[profile-save] Request error", {
        userId: user.id,
        profileId: params.id,
        message: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }, { logLabel: "vanity-save", request });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return withUser(async (user) => {
    await deleteProfile(user, params.id);
    return { ok: true };
  }, { logLabel: "profile-save", request });
}
