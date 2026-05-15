import Link from "next/link";
import { Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { GiftDetailActions } from "@/components/gift-detail-actions";
import { AppShell } from "@/components/shell";
import { Hearts } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getGiftDetailForViewer } from "@/lib/db";

export default async function GiftDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const detail = await getGiftDetailForViewer(user, params.id);
  if (!detail) notFound();

  const { gift, profile, viewerRole } = detail;
  const buyUrl = gift.affiliateUrl || gift.monetizedUrl || gift.originalUrl || gift.productUrl;
  const description =
    gift.notes ||
    "Saved gift idea. Add notes when you want to remember size, color, timing, or why this would be a thoughtful pick.";
  const backHref = viewerRole === "owner" ? `/profiles/${profile.slug}` : `/shared/${profile.slug}`;

  return (
    <AppShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <Link className="text-sm font-black text-spruce underline" href={backHref}>
          Back to wishlist
        </Link>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
            <div className="aspect-square bg-cloud p-4 sm:aspect-[4/3]">
              <img src={gift.imageUrl} alt="" className="h-full w-full object-contain" />
            </div>
          </div>

          <aside className="grid content-start gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-black uppercase text-berry">{profile.displayName}</p>
              <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{gift.title}</h1>
            </div>

            <Hearts value={gift.wantRating} />

            <div className="grid gap-2 rounded-3xl bg-cloud p-4">
              <p className="text-sm font-black text-ink/70">Buy or reserve this gift</p>
              <p className="text-xs font-bold leading-5 text-ink/55">
                Reserve it so others know you're planning to buy it.
              </p>
            </div>

            <p className="text-sm font-semibold leading-6 text-ink/65">{description}</p>

            <GiftDetailActions gift={gift} buyUrl={buyUrl} viewerRole={viewerRole} currentUserId={user.id} />
          </aside>
        </section>

        <section className="grid gap-3 rounded-[2rem] border border-dashed border-ink/15 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-berry" />
            <h2 className="text-xl font-black">Related gift ideas</h2>
          </div>
          <p className="text-sm font-semibold leading-6 text-ink/60">
            Giftly will later surface similar ideas, better total prices, and thoughtful alternatives from trusted stores.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {["Similar ideas", "Better total price", "More from this wishlist"].map((label) => (
              <div className="rounded-2xl bg-cloud p-3 text-sm font-black text-ink/65" key={label}>
                {label}
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
