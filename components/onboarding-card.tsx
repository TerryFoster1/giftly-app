"use client";

import Link from "next/link";
import { CheckCircle2, Gift, Plus, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui";

type OnboardingCardProps = {
  userName?: string;
  wishlistCount: number;
  onCreateWishlist: () => void;
  onInvite: () => void;
};

const storageKey = "giftly_onboarding_dismissed";

export function OnboardingCard({ userName, wishlistCount, onCreateWishlist, onInvite }: OnboardingCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(storageKey) !== "true");
  }, []);

  function skip() {
    window.localStorage.setItem(storageKey, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-berry">Guided setup</p>
          <h2 className="mt-1 text-2xl font-black">Make Giftly useful in five minutes.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
            Start with who you save gifts for, keep your own birthday list ready to share, and invite people when you are ready.
          </p>
        </div>
        <Button type="button" variant="ghost" aria-label="Skip onboarding" onClick={skip}>
          <X size={16} />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Who are you saving for?", `${userName || "You"} plus family and friends`, <UsersRound size={18} />],
          ["Starter wishlists", wishlistCount >= 3 ? "My Birthday and Cool Stuff are ready" : "Create a few useful lists", <Gift size={18} />],
          ["Birthdays and events", "Add dates so gift planning has context", <CheckCircle2 size={18} />],
          ["Invite later", "Family and friends can join when it feels useful", <Plus size={18} />]
        ].map(([title, copy, icon]) => (
          <div className="rounded-3xl bg-cloud p-3" key={String(title)}>
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-2xl bg-white text-berry">{icon}</div>
            <h3 className="font-black">{title}</h3>
            <p className="mt-1 text-sm font-semibold leading-5 text-ink/60">{copy}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <Button type="button" onClick={onCreateWishlist}>
          <Plus size={16} />
          Create wishlist
        </Button>
        <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-spruce hover:bg-spruce hover:text-white" href="/profiles">
          Add birthdays
        </Link>
        <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-blush" href="/onboarding">
          Guided setup
        </Link>
        <Button type="button" variant="ghost" onClick={onInvite}>
          <UsersRound size={16} />
          Invite people
        </Button>
        <Button type="button" variant="ghost" onClick={skip}>
          Skip for now
        </Button>
      </div>

      <p className="rounded-2xl bg-blush p-3 text-xs font-bold leading-5 text-berry">
        Quick tour: paste a gift link, create or share a wishlist, invite family or friends, then view someone else's public wishlist when they share it with you.
      </p>
    </section>
  );
}
