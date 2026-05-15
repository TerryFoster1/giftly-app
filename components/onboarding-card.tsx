"use client";

import Link from "next/link";
import { Plus, UsersRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui";

type OnboardingCardProps = {
  userName?: string;
  onboardingCompleted?: boolean;
  wishlistCount: number;
  onCreateWishlist: () => void;
  onInvite: () => void;
  onComplete: () => void | Promise<unknown>;
};

const storageKey = "giftly_onboarding_dismissed";

export function OnboardingCard({ userName, onboardingCompleted, wishlistCount, onCreateWishlist, onInvite, onComplete }: OnboardingCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!onboardingCompleted && window.localStorage.getItem(storageKey) !== "true");
  }, [onboardingCompleted]);

  function skip() {
    window.localStorage.setItem(storageKey, "true");
    setVisible(false);
    void onComplete();
  }

  if (!visible) return null;

  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-berry">Quick start</p>
          <h2 className="mt-1 text-lg font-black">Build your gifting circle.</h2>
          <p className="mt-1 max-w-2xl text-sm font-semibold leading-5 text-ink/60">
            Add people to your Bubble, create/share a wishlist, then save a gift link when inspiration hits.
          </p>
        </div>
        <Button type="button" variant="ghost" aria-label="Skip onboarding" onClick={skip}>
          <X size={16} />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={onCreateWishlist}>
          <Plus size={16} />
          Create wishlist
        </Button>
        <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-spruce hover:bg-spruce hover:text-white" href="/profiles">
          <UsersRound size={16} />
          My Bubble
        </Link>
        <Button type="button" variant="ghost" onClick={onInvite}>
          <UsersRound size={16} />
          Invite
        </Button>
        <Button type="button" variant="ghost" onClick={skip}>
          Skip for now
        </Button>
      </div>
    </section>
  );
}
