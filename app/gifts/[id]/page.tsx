import Link from "next/link";
import { ExternalLink, Sparkles, Store } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { Hearts } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedGiftDetail } from "@/lib/db";

export default async function GiftDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const detail = await getOwnedGiftDetail(user, params.id);
  if (!detail) notFound();

  const { gift, profile } = detail;
  const priceLabel = gift.currency ? `${gift.currency} $${gift.price.toFixed(2)}` : gift.price ? gift.price.toFixed(2) : "Price not saved";
  const buyUrl = gift.affiliateUrl || gift.monetizedUrl || gift.originalUrl || gift.productUrl;
  const description =
    gift.notes ||
    "A saved gift idea for this wishlist. Add notes when you want to remember size, color, timing, or why this would be a thoughtful pick.";

  return (
    <AppShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <Link className="text-sm font-black text-spruce underline" href={`/profiles/${profile.slug}`}>
          Back to wishlist
        </Link>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
            <div className="aspect-square bg-cloud sm:aspect-[4/3]">
              <img src={gift.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          </div>

          <aside className="grid content-start gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
            <div>
              <p className="text-sm font-black uppercase text-berry">{profile.displayName}</p>
              <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{gift.title}</h1>
            </div>

            <Hearts value={gift.wantRating} />

            <div className="grid gap-3 rounded-3xl bg-cloud p-4">
              <div className="flex items-center gap-2 text-sm font-black text-ink/60">
                <Store size={16} className="text-berry" />
                Store and price
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-lg font-black">{gift.storeName || "Saved store"}</p>
                <p className="rounded-full bg-white px-3 py-1 text-sm font-black text-spruce">{priceLabel}</p>
              </div>
            </div>

            <p className="text-sm font-semibold leading-6 text-ink/65">{description}</p>

            <a
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-2 text-sm font-extrabold text-white hover:bg-berry"
              href={buyUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={16} />
              Buy Now
            </a>

            <p className="text-xs font-bold leading-5 text-ink/50">
              The original store link stays behind the Buy Now button. Future affiliate links can be swapped in without exposing raw source URLs.
            </p>
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
