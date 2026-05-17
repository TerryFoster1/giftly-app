"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gift, ShoppingBag } from "lucide-react";
import { clientRequestJson } from "@/lib/client-api";
import type { GiftItem, SecretSantaAssignmentDetail, SecretSantaGiftActionType } from "@/lib/types";

function formatPrice(gift: GiftItem) {
  if (!gift.price) return "Price not set";
  return `${gift.currency ? `${gift.currency} ` : ""}${gift.price.toFixed(2)}`;
}

function buyUrl(gift: GiftItem) {
  return gift.affiliateUrl || gift.monetizedUrl || gift.productUrl || gift.originalUrl;
}

export function SecretSantaAssignmentClient({ eventId }: { eventId: string }) {
  const [detail, setDetail] = useState<SecretSantaAssignmentDetail | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const actionByGift = useMemo(() => {
    const map = new Map<string, SecretSantaGiftActionType>();
    detail?.giftActions.forEach((action) => map.set(action.giftItemId, action.action));
    return map;
  }, [detail?.giftActions]);

  async function refresh() {
    const nextDetail = await clientRequestJson<SecretSantaAssignmentDetail>(`/api/secret-santa/${eventId}/assignment`);
    setDetail(nextDetail);
    setNote(nextDetail.assignment.privateNote || "");
  }

  useEffect(() => {
    refresh().catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not load your assignment."));
  }, [eventId]);

  async function saveAction(giftItemId: string, action: SecretSantaGiftActionType) {
    setSaving(`${giftItemId}-${action}`);
    setMessage("");
    setError("");
    try {
      const nextDetail = await clientRequestJson<SecretSantaAssignmentDetail>(`/api/secret-santa/${eventId}/gift-actions`, {
        method: "POST",
        body: JSON.stringify({ giftItemId, action })
      });
      setDetail(nextDetail);
      setMessage(action === "purchased" ? "Marked purchased for this exchange." : "Reserved for this exchange.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save this gift action.");
    } finally {
      setSaving("");
    }
  }

  async function saveNote() {
    setSaving("note");
    setMessage("");
    setError("");
    try {
      const nextDetail = await clientRequestJson<SecretSantaAssignmentDetail>(`/api/secret-santa/${eventId}/gift-actions`, {
        method: "POST",
        body: JSON.stringify({ assignmentNote: note })
      });
      setDetail(nextDetail);
      setMessage("Private note saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save your note.");
    } finally {
      setSaving("");
    }
  }

  if (!detail && !error) {
    return <main className="mx-auto max-w-6xl px-4 py-8 text-sm font-bold text-ink/60">Loading your assignment...</main>;
  }

  if (!detail) {
    return <main className="mx-auto max-w-6xl px-4 py-8 text-sm font-bold text-red-600">{error}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-coral">Your private assignment</p>
        <h1 className="mt-2 text-3xl font-black text-ink">You are buying for {detail.recipient.displayName}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold text-ink/65">
          Reserve or mark gifts here so other participants can avoid duplicates. These Secret Santa notes and actions stay hidden from your recipient.
        </p>
        {detail.event.spendingLimit ? <p className="mt-4 rounded-2xl bg-blush p-3 text-sm font-black text-ink">Spending limit: {detail.event.spendingLimit.toFixed(2)}</p> : null}
        {message ? <p className="mt-4 rounded-2xl bg-mint/40 p-3 text-sm font-bold text-ink">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
      </section>

      <section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-soft">
        <h2 className="text-lg font-black text-ink">Private notes</h2>
        <textarea className="mt-3 min-h-28 w-full rounded-2xl border border-ink/10 px-4 py-3 text-sm font-semibold outline-none focus:border-coral" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Sizes, delivery plans, backup ideas..." />
        <button className="mt-3 rounded-2xl bg-ink px-4 py-3 text-sm font-black text-white disabled:opacity-60" onClick={saveNote} disabled={saving === "note"}>
          {saving === "note" ? "Saving..." : "Save private note"}
        </button>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-black text-ink">{detail.recipient.displayName}'s gift ideas</h2>
        {!detail.gifts.length ? (
          <p className="mt-4 rounded-2xl bg-white p-5 text-sm font-bold text-ink/60">No shared gift ideas are available yet.</p>
        ) : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detail.gifts.map((gift) => {
            const action = actionByGift.get(gift.id);
            return (
              <article key={gift.id} className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft">
                <div className="grid aspect-[4/3] place-items-center bg-blush/50 p-4">
                  {gift.imageUrl ? <img src={gift.imageUrl} alt="" className="max-h-full max-w-full object-contain" /> : <Gift className="text-coral" />}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-black text-ink">{gift.title}</h3>
                  <p className="mt-2 text-sm font-bold text-ink/55">{formatPrice(gift)}</p>
                  {action ? (
                    <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-mint/40 px-3 py-1 text-xs font-black text-ink">
                      <CheckCircle2 size={14} /> {action === "purchased" ? "Purchased by you" : "Reserved by you"}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-2">
                    <a className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white" href={buyUrl(gift)} target="_blank" rel="noreferrer">
                      <ShoppingBag size={16} /> Buy Now
                    </a>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="rounded-2xl border border-ink/10 px-3 py-2 text-xs font-black text-ink disabled:opacity-50" onClick={() => saveAction(gift.id, "reserved")} disabled={Boolean(saving)}>
                        Reserve
                      </button>
                      <button className="rounded-2xl border border-ink/10 px-3 py-2 text-xs font-black text-ink disabled:opacity-50" onClick={() => saveAction(gift.id, "purchased")} disabled={Boolean(saving)}>
                        Purchased
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <Link className="mt-6 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink shadow-soft" href={`/secret-santa/${eventId}`}>
          Back to exchange
        </Link>
      </section>
    </main>
  );
}
