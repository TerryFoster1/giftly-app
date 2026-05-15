"use client";

import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import type { GiftItem } from "@/lib/types";
import { GiftCard } from "./gift-card";

export function SharedWishlistClient({ slug }: { slug: string }) {
  const { user, sharedWishlists = [], ready, actionError, actions } = useGiftlyStore();
  const [message, setMessage] = useState("");

  const sharedWishlist = useMemo(
    () => sharedWishlists.find((wishlist) => wishlist.profile.slug === slug),
    [sharedWishlists, slug]
  );

  async function updateGift(gift: GiftItem, action: "reserve" | "unreserve" | "purchase") {
    setMessage("");
    try {
      await actions.updateSharedGift(gift.id, action);
      setMessage(action === "purchase" ? "Marked purchased." : action === "unreserve" ? "Reservation removed." : "Reserved by you.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This gift could not be updated.");
    }
  }

  if (!ready) {
    return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading shared wishlist...</main>;
  }

  if (!sharedWishlist) {
    return (
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-10">
        <Link className="text-sm font-black text-spruce underline" href="/dashboard">
          Back to dashboard
        </Link>
        <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">
          {actionError || "Shared wishlist not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5">
      <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
        <Link className="text-sm font-black text-spruce underline" href="/dashboard">
          Back to dashboard
        </Link>
        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-berry">Shared with me</p>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">{sharedWishlist.profile.displayName}'s Gift Ideas</h1>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-ink/60">
            {sharedWishlist.ownerName} shared this wishlist with you. Reserve a gift when you're planning to buy it so everyone else can avoid duplicates.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-black text-ink/55">
            <span className="rounded-full bg-cloud px-3 py-1">
              {sharedWishlist.gifts.length} {sharedWishlist.gifts.length === 1 ? "idea" : "ideas"}
            </span>
            {sharedWishlist.eventDate ? <span className="rounded-full bg-blush px-3 py-1 text-berry">{sharedWishlist.eventDate}</span> : null}
          </div>
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}

      {sharedWishlist.gifts.length ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {sharedWishlist.gifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              currentUserId={user?.id}
              publicMode
              onReserve={(item) => updateGift(item, "reserve")}
              onUnreserve={(item) => updateGift(item, "unreserve")}
              onMarkPurchased={(item) => updateGift(item, "purchase")}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-ink/20 bg-white p-8 text-center">
          <Sparkles className="mx-auto text-berry" size={24} />
          <h3 className="mt-3 text-xl font-black">No shared gifts yet.</h3>
          <p className="mt-2 font-semibold text-ink/60">When gifts are shared with you, they will appear here.</p>
        </div>
      )}

      <section className="grid gap-2 rounded-[2rem] border border-dashed border-ink/15 bg-white p-4">
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-berry" />
          <h2 className="text-xl font-black">Surprise-safe planning</h2>
        </div>
        <p className="text-sm font-semibold leading-6 text-ink/60">
          Other shared viewers can see when something is reserved or purchased. The wishlist owner does not see those spoiler statuses.
        </p>
      </section>
    </main>
  );
}
