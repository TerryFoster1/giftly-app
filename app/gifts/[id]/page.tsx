import Link from "next/link";
import { ExternalLink } from "lucide-react";
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

  return (
    <AppShell>
      <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:grid-cols-[1fr_22rem]">
        <section className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
          <div className="aspect-[4/3] bg-cloud">
            <img src={gift.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="grid gap-4 p-5">
            <div>
              <p className="text-sm font-black uppercase text-berry">{profile.displayName}</p>
              <h1 className="text-3xl font-black leading-tight">{gift.title}</h1>
              <p className="mt-2 text-sm font-bold text-ink/55">{gift.storeName} · {priceLabel}</p>
            </div>
            <Hearts value={gift.wantRating} />
            {gift.notes ? <p className="rounded-2xl bg-cloud p-4 text-sm font-semibold leading-6 text-ink/65">{gift.notes}</p> : null}
            <a
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-2 text-sm font-extrabold text-white hover:bg-berry"
              href={gift.productUrl}
              target="_blank"
            >
              <ExternalLink size={16} />
              Buy Now
            </a>
          </div>
        </section>
        <aside className="grid gap-3 self-start rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <h2 className="text-xl font-black">Product page foundation</h2>
          <p className="text-sm font-semibold leading-6 text-ink/60">
            Store links stay behind the Buy Now button. Later this page can swap in affiliate URLs without exposing raw product URLs.
          </p>
          <Link className="text-sm font-black text-spruce underline" href={`/profiles/${profile.slug}`}>
            Back to wishlist
          </Link>
        </aside>
      </main>
    </AppShell>
  );
}
