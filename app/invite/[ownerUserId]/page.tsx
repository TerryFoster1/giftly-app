import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptBubbleInvite } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function invitePath(ownerUserId: string, searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  const groupId = Array.isArray(searchParams.groupId) ? searchParams.groupId[0] : searchParams.groupId;
  const wishlistId = Array.isArray(searchParams.wishlistId) ? searchParams.wishlistId[0] : searchParams.wishlistId;
  if (groupId) params.set("groupId", groupId);
  if (wishlistId) params.set("wishlistId", wishlistId);
  const query = params.toString();
  return `/invite/${ownerUserId}${query ? `?${query}` : ""}`;
}

export default async function BubbleInvitePage({
  params,
  searchParams
}: {
  params: { ownerUserId: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await getCurrentUser();
  const next = invitePath(params.ownerUserId, searchParams);

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  try {
    await acceptBubbleInvite(user, {
      ownerUserId: params.ownerUserId,
      groupId: Array.isArray(searchParams.groupId) ? searchParams.groupId[0] : searchParams.groupId,
      wishlistId: Array.isArray(searchParams.wishlistId) ? searchParams.wishlistId[0] : searchParams.wishlistId
    });
  } catch (error) {
    console.warn("[bubble-invite] Invite acceptance failed", {
      ownerUserId: params.ownerUserId,
      reason: error instanceof Error ? error.message : "unknown"
    });
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-10">
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 text-center shadow-soft">
          <p className="text-sm font-black uppercase text-berry">Invite unavailable</p>
          <h1 className="mt-2 text-3xl font-black">This Giftly invite could not be opened.</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-ink/60">
            The link may be expired or unavailable. You can still open your dashboard and ask them to send a fresh invite.
          </p>
          <Link className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-coral px-4 text-sm font-extrabold text-white hover:bg-berry" href="/dashboard">
            Go to dashboard
          </Link>
        </section>
      </main>
    );
  }

  redirect("/dashboard?connected=1");
}
