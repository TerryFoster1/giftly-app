"use client";

import { Check, Edit3, ExternalLink, Lock, Trash2 } from "lucide-react";
import type { GiftItem } from "@/lib/types";
import { Button, Hearts } from "./ui";

type GiftCardProps = {
  gift: GiftItem;
  onEdit?: (gift: GiftItem) => void;
  onDelete?: (id: string) => void;
  onToggleReserved?: (gift: GiftItem) => void;
  onTogglePurchased?: (gift: GiftItem) => void;
  publicMode?: boolean;
  onReserve?: (gift: GiftItem) => void;
  onContribute?: (gift: GiftItem) => void;
};

export function GiftCard({
  gift,
  onEdit,
  onDelete,
  onToggleReserved,
  onTogglePurchased,
  publicMode,
  onReserve,
  onContribute
}: GiftCardProps) {
  const progress = gift.fundingGoalAmount ? Math.min(100, (gift.currentContributionAmount / gift.fundingGoalAmount) * 100) : 0;

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-cloud">
        <img src={gift.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-berry">{gift.eventTag}</p>
            <h3 className="text-lg font-black leading-tight">{gift.title}</h3>
            <p className="text-sm font-bold text-ink/55">{gift.storeName} · {gift.currency} ${gift.price.toFixed(2)}</p>
          </div>
          <Hearts value={gift.wantRating} />
        </div>
        {!publicMode ? (
          <div className="flex flex-wrap gap-2 text-xs font-black">
            <span className="rounded-full bg-blush px-3 py-1 text-berry">{gift.visibility}</span>
            {gift.hiddenFromRecipient ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-3 py-1 text-ink/70">
                <Lock size={12} />
                hidden
              </span>
            ) : null}
            {gift.reservedStatus === "reserved" ? <span className="rounded-full bg-mint px-3 py-1 text-spruce">reserved</span> : null}
            {gift.purchasedStatus ? <span className="rounded-full bg-honey/40 px-3 py-1">purchased</span> : null}
          </div>
        ) : (
          <p className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65">
            {gift.reservedStatus === "reserved" ? "This gift is already reserved." : "Available to reserve."}
          </p>
        )}
        {gift.allowContributions ? (
          <div className="rounded-2xl bg-mint/70 p-3">
            <div className="flex justify-between text-xs font-black text-spruce">
              <span>Gift pool</span>
              <span>${gift.currentContributionAmount.toFixed(0)} / ${gift.fundingGoalAmount.toFixed(0)}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-spruce" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
        {gift.notes && !publicMode ? <p className="text-sm font-semibold leading-6 text-ink/60">{gift.notes}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {publicMode ? (
            <>
              <a className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-2 text-sm font-extrabold text-white hover:bg-berry" href={gift.productUrl} target="_blank">
                <ExternalLink size={16} />
                Buy from Store
              </a>
              {gift.reservedStatus === "reserved" ? (
                <Button type="button" variant="ghost" disabled>Reserved</Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => onReserve?.(gift)}>Reserve Gift</Button>
              )}
              {gift.allowContributions ? (
                <Button type="button" variant="ghost" className="sm:col-span-2" onClick={() => onContribute?.(gift)}>
                  Contribute
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={() => onEdit?.(gift)}>
                <Edit3 size={16} />
                Edit
              </Button>
              <Button type="button" variant="ghost" onClick={() => onToggleReserved?.(gift)}>
                <Check size={16} />
                {gift.reservedStatus === "reserved" ? "Unreserve" : "Reserve"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => onTogglePurchased?.(gift)}>
                <Check size={16} />
                {gift.purchasedStatus ? "Unbuy" : "Purchased"}
              </Button>
              <Button type="button" variant="danger" onClick={() => onDelete?.(gift.id)}>
                <Trash2 size={16} />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
