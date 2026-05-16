"use client";

import Link from "next/link";
import { Check, ExternalLink, Settings } from "lucide-react";
import { useState } from "react";
import type { GiftItem } from "@/lib/types";
import { Button } from "./ui";

type GiftDetailActionsProps = {
  gift: GiftItem;
  buyUrl: string;
  viewerRole: "owner" | "shared";
  currentUserId: string;
  profileSlug: string;
};

export function GiftDetailActions({ gift, buyUrl, viewerRole, currentUserId, profileSlug }: GiftDetailActionsProps) {
  const [currentGift, setCurrentGift] = useState(gift);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const reservedByViewer = currentGift.reservedByUserId === currentUserId;
  const unavailableToViewer = viewerRole === "shared" && (currentGift.purchasedStatus || (currentGift.reservedStatus === "reserved" && !reservedByViewer));

  async function updatePlan(action: "reserve" | "unreserve" | "purchase") {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/shared-gifts/${currentGift.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "This gift could not be updated.");
      setCurrentGift(body as GiftItem);
      setMessage(action === "purchase" ? "Marked purchased." : action === "unreserve" ? "Reservation removed." : "Reserved by you.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This gift could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  async function updateOwnerPlan(action: "reserve" | "purchase") {
    setSaving(true);
    setMessage("");
    const nextGift: GiftItem = {
      ...currentGift,
      reservedStatus: action === "reserve" ? (currentGift.reservedStatus === "reserved" ? "available" : "reserved") : currentGift.reservedStatus,
      reservedBy: action === "reserve" ? (currentGift.reservedStatus === "reserved" ? undefined : "Planned") : currentGift.reservedBy,
      purchasedStatus: action === "purchase" ? !currentGift.purchasedStatus : currentGift.purchasedStatus,
      updatedAt: new Date().toISOString()
    };
    try {
      const response = await fetch(`/api/gifts/${currentGift.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(nextGift)
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "This gift could not be updated.");
      setCurrentGift(body as GiftItem);
      setMessage(action === "purchase" ? "Purchased status updated." : "Reserved status updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This gift could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-2">
      {unavailableToViewer ? (
        <p className="rounded-2xl bg-cloud p-3 text-sm font-black text-ink/55">
          {currentGift.purchasedStatus ? "Purchased by someone." : "Reserved by someone."}
        </p>
      ) : (
        <a
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-2 text-sm font-extrabold text-white hover:bg-berry"
          href={buyUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink size={16} />
          Buy Now
        </a>
      )}

      {viewerRole === "shared" ? (
        <>
          {reservedByViewer ? (
            <Button type="button" variant="ghost" disabled={saving} onClick={() => updatePlan("unreserve")}>
              Reserved by you - unreserve
            </Button>
          ) : (
            <Button type="button" variant="secondary" disabled={saving || unavailableToViewer} onClick={() => updatePlan("reserve")}>
              Reserve this gift
            </Button>
          )}
          <Button type="button" variant="ghost" disabled={saving || unavailableToViewer} onClick={() => updatePlan("purchase")}>
            Mark purchased
          </Button>
          <p className="text-xs font-bold leading-5 text-ink/50">
            Reserve it so others know you're planning to buy it.
          </p>
        </>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" disabled={saving} onClick={() => updateOwnerPlan("reserve")}>
              <Check size={16} />
              {currentGift.reservedStatus === "reserved" ? "Reserved/planned" : "Reserve this gift"}
            </Button>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => updateOwnerPlan("purchase")}>
              <Check size={16} />
              {currentGift.purchasedStatus ? "Purchased" : "Mark purchased"}
            </Button>
          </div>
          <Link className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-blush" href={`/profiles/${profileSlug}`}>
            <Settings size={16} />
            Manage on wishlist
          </Link>
          <p className="text-xs font-bold leading-5 text-ink/50">
            Saved gift idea. Spoiler statuses from other people stay hidden here.
          </p>
        </>
      )}

      {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
    </div>
  );
}
