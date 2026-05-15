"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { eventTags, type GiftItem, type Profile } from "@/lib/types";
import { Brand } from "./brand";
import { GiftCard } from "./gift-card";
import { Button, Field, Input, Select } from "./ui";

export function PublicProfileClient({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [ready, setReady] = useState(false);
  const [eventFilter, setEventFilter] = useState("All");
  const [reserveGift, setReserveGift] = useState<GiftItem | null>(null);
  const [contributionGift, setContributionGift] = useState<GiftItem | null>(null);
  const [reserver, setReserver] = useState({ name: "", email: "" });

  useEffect(() => {
    fetch(`/api/public/profiles/${slug}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { profile: Profile; gifts: GiftItem[] } | null) => {
        setProfile(data?.profile ?? null);
        setGifts(data?.gifts ?? []);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [slug]);

  const publicGifts = useMemo(() => {
    return gifts.filter((gift) => eventFilter === "All" || gift.eventTag === eventFilter);
  }, [eventFilter, gifts]);

  if (!ready) return <main className="mx-auto max-w-5xl px-4 py-10 font-bold">Loading wishlist…</main>;

  if (!profile) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Brand />
        <div className="mt-8 rounded-[2rem] bg-white p-8 text-center shadow-soft">
          <h1 className="text-3xl font-black">Wishlist not found</h1>
          <p className="mt-2 font-semibold text-ink/60">This public profile may have moved.</p>
        </div>
      </main>
    );
  }

  function submitReservation(event: React.FormEvent) {
    event.preventDefault();
    if (!reserveGift || !reserver.name) return;
    if (reserveGift.purchasedStatus || reserveGift.reservedStatus === "reserved") return;
    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId: reserveGift.id, reserverName: reserver.name, reserverEmail: reserver.email })
    }).then((response) => {
      if (!response.ok) return;
      setGifts((current) =>
        current.map((gift) =>
          gift.id === reserveGift.id
            ? { ...gift, reservedStatus: "reserved", reservedBy: "Reserved", updatedAt: new Date().toISOString() }
            : gift
        )
      );
    });
    setReserveGift(null);
    setReserver({ name: "", email: "" });
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Brand />
        <Link className="rounded-full bg-white px-4 py-2 text-sm font-black shadow-sm" href="/">Get Giftly</Link>
      </header>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 pb-10">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={profile.photoUrl || "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop"} alt="" className="h-24 w-24 rounded-[2rem] object-cover" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase text-berry">Public wishlist</p>
              <h1 className="text-4xl font-black">{profile.displayName}</h1>
              <p className="mt-2 max-w-2xl font-semibold leading-7 text-ink/65">{profile.bio}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option>All</option>
              {eventTags.map((tag) => <option key={tag}>{tag}</option>)}
            </Select>
            <span className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-black text-spruce">
              <Gift size={16} />
              {publicGifts.length} ideas
            </span>
          </div>
        </div>
        {publicGifts.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {publicGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                publicMode
                onReserve={setReserveGift}
                onContribute={setContributionGift}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-ink/20 bg-white p-8 text-center">
            <h2 className="text-xl font-black">No public gifts here yet.</h2>
            <p className="mt-2 font-semibold text-ink/60">Private and hidden items are filtered before this page renders.</p>
          </div>
        )}
      </section>
      {reserveGift ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/35 p-4 sm:place-items-center">
          <form onSubmit={submitReservation} className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-soft">
            <h2 className="text-2xl font-black">Reserve this gift</h2>
            <p className="mt-2 font-semibold text-ink/60">Giftly will mark it reserved without revealing detailed buyer info publicly.</p>
            <div className="mt-4 grid gap-3">
              <Field label="Name">
                <Input required value={reserver.name} onChange={(event) => setReserver({ ...reserver, name: event.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={reserver.email} onChange={(event) => setReserver({ ...reserver, email: event.target.value })} />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button type="button" variant="ghost" onClick={() => setReserveGift(null)}>Cancel</Button>
              <Button type="submit">Reserve</Button>
            </div>
          </form>
        </div>
      ) : null}
      {contributionGift ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/35 p-4 sm:place-items-center">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-soft">
            <h2 className="text-2xl font-black">Contributions are coming soon</h2>
            <p className="mt-2 font-semibold leading-7 text-ink/65">
              Gift pooling is scaffolded for {contributionGift.title}, but real Stripe payments are intentionally not enabled in this MVP.
            </p>
            <Button type="button" className="mt-4 w-full" onClick={() => setContributionGift(null)}>Got it</Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
