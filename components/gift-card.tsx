"use client";

import Link from "next/link";
import { Check, Edit3, ExternalLink, Lock, Trash2 } from "lucide-react";
import type { GiftItem } from "@/lib/types";
import { Hearts } from "./ui";

type GiftCardProps = {
  gift: GiftItem;
  currentUserId?: string;
  onEdit?: (gift: GiftItem) => void;
  onDelete?: (id: string) => void;
  onToggleReserved?: (gift: GiftItem) => void;
  onTogglePurchased?: (gift: GiftItem) => void;
  publicMode?: boolean;
  onReserve?: (gift: GiftItem) => void;
  onUnreserve?: (gift: GiftItem) => void;
  onMarkPurchased?: (gift: GiftItem) => void;
  onContribute?: (gift: GiftItem) => void;
};

export function GiftCard({
  gift,
  currentUserId,
  onEdit,
  onDelete,
  onToggleReserved,
  onTogglePurchased,
  publicMode,
  onReserve,
  onUnreserve,
  onMarkPurchased,
  onContribute
}: GiftCardProps) {
  const progress = gift.fundingGoalAmount ? Math.min(100, (gift.currentContributionAmount / gift.fundingGoalAmount) * 100) : 0;
  const priceLabel = gift.currency ? `${gift.currency} $${gift.price.toFixed(2)}` : gift.price ? gift.price.toFixed(2) : "Price not saved";
  const metaLabel = publicMode ? "" : [gift.storeName, priceLabel].filter(Boolean).join(" / ");
  const detailPath = `/gifts/${gift.id}`;
  const buyUrl = gift.affiliateUrl || gift.monetizedUrl || gift.originalUrl || gift.productUrl;
  const reservedByCurrentViewer = Boolean(currentUserId && gift.reservedByUserId === currentUserId);
  const reservedByOtherViewer = gift.reservedStatus === "reserved" && !reservedByCurrentViewer;
  const unavailableToViewer = publicMode && (gift.purchasedStatus || reservedByOtherViewer);
  const image = (
    <div className="aspect-[6/4] bg-cloud p-2">
      <img src={gift.imageUrl} alt="" className="h-full w-full object-contain" />
    </div>
  );

  return (
    <article className="group overflow-hidden rounded-[1.15rem] border border-ink/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link className="block" href={detailPath}>{image}</Link>
      <div className="grid gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-berry">{gift.eventTag}</p>
            {publicMode ? (
              <Link className="mt-0.5 block text-base font-black leading-tight hover:text-berry" href={detailPath}>
                {gift.title}
              </Link>
            ) : (
              <Link className="mt-0.5 block text-base font-black leading-tight hover:text-berry" href={detailPath}>
                {gift.title}
              </Link>
            )}
            {metaLabel ? <p className="mt-1 text-xs font-bold text-ink/55">{metaLabel}</p> : null}
          </div>
          <Hearts value={gift.wantRating} />
        </div>

        {!publicMode ? (
          <div className="flex flex-wrap gap-1.5 text-[0.68rem] font-black">
            <span className="rounded-full bg-blush px-2 py-0.5 text-berry">{gift.visibility}</span>
            {gift.hiddenFromRecipient ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cloud px-2 py-0.5 text-ink/70">
                <Lock size={11} />
                hidden
              </span>
            ) : null}
          </div>
        ) : (
          <p className="rounded-2xl bg-cloud p-2 text-xs font-bold text-ink/65">
            {gift.purchasedStatus ? "Purchased by someone." : reservedByCurrentViewer ? "Reserved by you." : gift.reservedStatus === "reserved" ? "Reserved by someone." : "Available to reserve."}
          </p>
        )}

        {gift.allowContributions ? (
          <div className="rounded-2xl bg-mint/70 p-2">
            <div className="flex justify-between text-xs font-black text-spruce">
              <span>Gift pool</span>
              <span>
                ${gift.currentContributionAmount.toFixed(0)} / ${gift.fundingGoalAmount.toFixed(0)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-spruce" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        {gift.notes && !publicMode ? <p className="line-clamp-2 text-xs font-semibold leading-5 text-ink/55">{gift.notes}</p> : null}

        <div className="grid gap-2">
          {publicMode ? (
            <>
              {unavailableToViewer ? (
                <button type="button" className="min-h-10 rounded-2xl bg-cloud px-3 py-2 text-sm font-extrabold text-ink/45" disabled>
                  {gift.purchasedStatus ? "Purchased" : "Reserved"}
                </button>
              ) : (
                <a
                  className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-coral px-3 py-2 text-sm font-extrabold text-white hover:bg-berry"
                  href={buyUrl}
                  target="_blank"
                >
                  <ExternalLink size={16} />
                  Buy Now
                </a>
              )}
              {reservedByCurrentViewer ? (
                <button
                  type="button"
                  className="focus-ring min-h-9 rounded-2xl border border-ink/10 bg-white px-3 text-xs font-black text-ink hover:bg-blush"
                  onClick={() => onUnreserve?.(gift)}
                >
                  Reserved by you - unreserve
                </button>
              ) : unavailableToViewer ? (
                <button type="button" className="min-h-9 rounded-2xl border border-ink/10 bg-white px-3 text-xs font-black text-ink/45" disabled>
                  Already planned
                </button>
              ) : (
                <button
                  type="button"
                  className="focus-ring min-h-9 rounded-2xl bg-mint px-3 text-xs font-black text-spruce hover:bg-spruce hover:text-white"
                  onClick={() => onReserve?.(gift)}
                >
                  Reserve Gift
                </button>
              )}
              {onMarkPurchased ? (
                <button
                  type="button"
                  className="focus-ring min-h-9 rounded-2xl border border-ink/10 bg-white px-3 text-xs font-black text-ink hover:bg-blush disabled:text-ink/35"
                  disabled={unavailableToViewer}
                  onClick={() => onMarkPurchased(gift)}
                >
                  Mark purchased
                </button>
              ) : null}
              {gift.allowContributions ? (
                <button
                  type="button"
                  className="focus-ring min-h-9 rounded-2xl border border-ink/10 bg-white px-3 text-xs font-black text-ink hover:bg-blush"
                  onClick={() => onContribute?.(gift)}
                >
                  Contribute
                </button>
              ) : null}
            </>
          ) : (
            <>
              <Link className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl bg-coral px-3 py-2 text-sm font-extrabold text-white hover:bg-berry" href={detailPath}>
                View
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-black text-ink/55">
                <button type="button" className="inline-flex items-center gap-1 hover:text-spruce" onClick={() => onToggleReserved?.(gift)}>
                  <Check size={13} />
                  Reserve
                </button>
                <button type="button" className="inline-flex items-center gap-1 hover:text-spruce" onClick={() => onTogglePurchased?.(gift)}>
                  <Check size={13} />
                  Purchased
                </button>
                <button type="button" className="inline-flex items-center gap-1 hover:text-spruce" onClick={() => onEdit?.(gift)}>
                  <Edit3 size={13} />
                  Edit
                </button>
                <button type="button" className="inline-flex items-center gap-1 text-berry/75 hover:text-berry" onClick={() => onDelete?.(gift.id)}>
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
