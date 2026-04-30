"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { getUpcomingProfileEvents } from "@/lib/events";
import { eventTags, type GiftItem, type Visibility } from "@/lib/types";
import { publicProfilePath } from "@/lib/url";
import { GiftCard } from "./gift-card";
import { GiftForm } from "./gift-form";
import { Button, Select } from "./ui";

export function DashboardClient({ initialSlug }: { initialSlug?: string }) {
  const { user, profiles, gifts, ready, actions } = useGiftlyStore();
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [eventFilter, setEventFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "All">("All");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<GiftItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const selectedProfile = useMemo(() => {
    if (!profiles.length) return undefined;
    return profiles.find((profile) => profile.slug === initialSlug) ?? profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
  }, [initialSlug, profiles, selectedProfileId]);

  const upcomingEvents = useMemo(() => getUpcomingProfileEvents(profiles).slice(0, 5), [profiles]);

  const visibleGifts = useMemo(() => {
    if (!selectedProfile) return [];
    return gifts
      .filter((gift) => gift.profileId === selectedProfile.id)
      .filter((gift) => eventFilter === "All" || gift.eventTag === eventFilter)
      .filter((gift) => visibilityFilter === "All" || gift.visibility === visibilityFilter)
      .sort((a, b) => {
        if (sort === "want") return b.wantRating - a.wantRating;
        if (sort === "price") return b.price - a.price;
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      });
  }, [eventFilter, gifts, selectedProfile, sort, visibilityFilter]);

  function saveGift(gift: GiftItem) {
    actions.saveGift(gift);
    setShowForm(false);
    setEditing(null);
  }

  function toggleReserved(gift: GiftItem) {
    actions.saveGift({
      ...gift,
      reservedStatus: gift.reservedStatus === "reserved" ? "available" : "reserved",
      reservedBy: gift.reservedStatus === "reserved" ? undefined : "Planned",
      updatedAt: new Date().toISOString()
    });
  }

  function togglePurchased(gift: GiftItem) {
    actions.saveGift({ ...gift, purchasedStatus: !gift.purchasedStatus, updatedAt: new Date().toISOString() });
  }

  if (!ready || !selectedProfile) {
    return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading Giftly…</main>;
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[20rem_1fr]">
      <aside className="grid gap-4 self-start lg:sticky lg:top-24">
        <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-berry">Logged in</p>
              <h1 className="text-2xl font-black">{user?.name ?? "Giftly"}</h1>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {profiles.map((profile) => (
              <button
                className={`focus-ring rounded-2xl p-3 text-left font-black ${profile.id === selectedProfile.id ? "bg-coral text-white" : "bg-cloud"}`}
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
              >
                <span className="block">{profile.displayName}</span>
                <span className="text-xs opacity-70">{profile.relationship}</span>
              </button>
            ))}
          </div>
        </section>
        <Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-2xl bg-mint px-4 text-sm font-black text-spruce hover:bg-spruce hover:text-white" href="/profiles">
          Create or Share Profiles
        </Link>
      </aside>
      <section className="grid gap-5">
        {upcomingEvents.length ? (
          <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <p className="text-sm font-black uppercase text-berry">Upcoming Events</p>
            <div className="mt-3 grid gap-2">
              {upcomingEvents.map((event) => (
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3" key={event.id}>
                  <p className="font-black">
                    {event.profileName}'s {event.eventType}
                    <span className="ml-2 text-sm font-bold text-ink/50">{event.dateLabel}</span>
                  </p>
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-spruce">
                    {event.daysUntil === 0 ? "today" : `in ${event.daysUntil} days`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
        <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-berry">Wishlist dashboard</p>
              <h2 className="text-3xl font-black">{selectedProfile.displayName}</h2>
              <Link className="mt-1 inline-block text-sm font-black text-spruce underline" href={publicProfilePath(selectedProfile.slug)}>
                View public profile
              </Link>
            </div>
            <Button type="button" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={17} />
              Add Gift
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option>All</option>
              {eventTags.map((tag) => <option key={tag}>{tag}</option>)}
            </Select>
            <Select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as Visibility | "All")}>
              <option>All</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="public">Public</option>
            </Select>
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="want">Want rating</option>
              <option value="price">Price</option>
            </Select>
          </div>
        </div>
        {showForm || editing ? (
          <GiftForm
            profileId={selectedProfile.id}
            gift={editing ?? undefined}
            onSave={saveGift}
            onCancel={() => { setEditing(null); setShowForm(false); }}
          />
        ) : null}
        {visibleGifts.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                onEdit={setEditing}
                onDelete={actions.deleteGift}
                onToggleReserved={toggleReserved}
                onTogglePurchased={togglePurchased}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-ink/20 bg-white p-8 text-center">
            <h3 className="text-xl font-black">No gifts match this view.</h3>
            <p className="mt-2 font-semibold text-ink/60">Add an idea or loosen the filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}
