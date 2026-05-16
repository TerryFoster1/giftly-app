"use client";

import Link from "next/link";
import { Copy, Plus, Share2, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { eventTags, type Connection, type GiftItem, type Visibility } from "@/lib/types";
import { publicProfilePath } from "@/lib/url";
import { GiftCard } from "./gift-card";
import { GiftForm } from "./gift-form";
import { Button, Field, Input, Select } from "./ui";

function connectionLabel(connection: Connection) {
  return connection.displayName || connection.realName || connection.emailOrPhone || "Connected person";
}

export function WishlistDetailClient({ slug }: { slug: string }) {
  const { user, profiles, gifts, connections = [], groups = [], wishlistShares = [], ready, actionError, actions } = useGiftlyStore();
  const [eventFilter, setEventFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "All">("All");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<GiftItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTargetType, setShareTargetType] = useState<"person" | "group" | "invite">("person");
  const [shareConnectionId, setShareConnectionId] = useState("");
  const [shareGroupId, setShareGroupId] = useState("");
  const [inviteValue, setInviteValue] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const selectedProfile = useMemo(() => profiles.find((profile) => profile.slug === slug), [profiles, slug]);
  const wishlistStats = useMemo(() => {
    if (!selectedProfile) return { total: 0, shared: 0 };
    const profileGifts = gifts.filter((gift) => gift.profileId === selectedProfile.id);
    return {
      total: profileGifts.length,
      shared: profileGifts.filter((gift) => gift.visibility !== "private").length
    };
  }, [gifts, selectedProfile]);
  const displayFirstName = selectedProfile?.displayName.split(" ")[0] ?? "Their";
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

  async function saveGift(gift: GiftItem) {
    setGiftMessage("");
    await actions.saveGift(gift);
    await actions.refresh();
    setGiftMessage("Gift saved.");
    setShowForm(false);
    setEditing(null);
  }

  async function saveShare() {
    if (!selectedProfile) return;
    setShareMessage("");
    try {
      if (shareTargetType === "person") {
        if (!shareConnectionId) {
          setShareMessage("Choose someone from your Bubble.");
          return;
        }
        await actions.shareWishlist({ profileId: selectedProfile.id, connectionId: shareConnectionId });
      } else if (shareTargetType === "group") {
        if (!shareGroupId) {
          setShareMessage("Choose a group.");
          return;
        }
        await actions.shareWishlist({ profileId: selectedProfile.id, groupId: shareGroupId });
      } else {
        if (!inviteValue.trim()) {
          setShareMessage("Add an email or phone number.");
          return;
        }
        const created = await actions.createConnection({ emailOrPhone: inviteValue.trim(), displayName: inviteValue.trim(), source: "EMAIL" });
        await actions.shareWishlist({ profileId: selectedProfile.id, connectionId: created.id });
        setInviteValue("");
      }
      await actions.refresh();
      setShareMessage("Wishlist shared.");
    } catch (error) {
      setShareMessage(error instanceof Error ? error.message : "Wishlist could not be shared.");
    }
  }

  async function copyShareLink() {
    if (!selectedProfile) return;
    const link = `${window.location.origin}${publicProfilePath(selectedProfile.slug)}`;
    await navigator.clipboard?.writeText(link);
    setShareMessage("Share link copied.");
  }

  async function toggleReserved(gift: GiftItem) {
    await actions.saveGift({
      ...gift,
      reservedStatus: gift.reservedStatus === "reserved" ? "available" : "reserved",
      reservedBy: gift.reservedStatus === "reserved" ? undefined : "Planned",
      updatedAt: new Date().toISOString()
    });
  }

  async function togglePurchased(gift: GiftItem) {
    await actions.saveGift({ ...gift, purchasedStatus: !gift.purchasedStatus, updatedAt: new Date().toISOString() });
  }

  if (!ready) {
    return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading wishlist...</main>;
  }

  if (!selectedProfile) {
    return (
      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-10">
        <Link className="text-sm font-black text-spruce underline" href="/dashboard">
          Back to dashboard
        </Link>
        <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">
          {actionError || "Wishlist not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5">
      <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link className="text-sm font-black text-spruce underline" href="/dashboard">
              Back to dashboard
            </Link>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-berry">
              {selectedProfile.isManagedProfile ? "Gift ideas for" : "Personal gift list"}
            </p>
            <h1 className="mt-1 text-3xl font-black leading-tight sm:text-5xl">{displayFirstName}'s Gift Ideas</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
              {selectedProfile.bio || `A thoughtful place to save what ${displayFirstName} might love, ready to share with family and friends when gift season sneaks up.`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-ink/55">
              <span className="rounded-full bg-cloud px-3 py-1">{wishlistStats.total} {wishlistStats.total === 1 ? "idea" : "ideas"}</span>
              <span className="rounded-full bg-blush px-3 py-1 text-berry">Shared with family & friends</span>
              <span className="rounded-full bg-cloud px-3 py-1">{wishlistStats.shared} shareable</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-3 text-sm font-black text-ink hover:bg-blush" href={publicProfilePath(selectedProfile.slug)}>
              <Share2 size={15} />
              Public view
            </Link>
            <Button type="button" variant="secondary" className="min-h-10" onClick={() => setShareOpen(true)}>
              <Share2 size={15} />
              Share
            </Button>
            <Button type="button" className="min-h-10" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={16} />
              Add Gift
            </Button>
          </div>
        </div>
      </section>

      {giftMessage ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{giftMessage}</p> : null}
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}

      <section className="grid gap-4">
        <div className="grid gap-2 rounded-[1.25rem] bg-white/55 p-2 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-ink/40">
            Occasion
            <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option>All events</option>
              {eventTags.map((tag) => <option key={tag}>{tag}</option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-ink/40">
            Sharing
            <Select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as Visibility | "All")}>
              <option>All visibility</option>
              <option value="private">Private</option>
              <option value="shared">Shared</option>
              <option value="public">Public</option>
            </Select>
          </label>
          <label className="grid gap-1 text-[0.65rem] font-black uppercase tracking-[0.08em] text-ink/40">
            Sort
            <Select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="want">Most wanted</option>
              <option value="price">Price</option>
            </Select>
          </label>
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
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
            <Sparkles className="mx-auto text-berry" size={24} />
            <h3 className="mt-3 text-xl font-black">No gifts match this view.</h3>
            <p className="mt-2 font-semibold text-ink/60">Add an idea or loosen the filters.</p>
          </div>
        )}
      </section>

      {shareOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-[2rem] bg-white p-4 shadow-soft sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-berry">Share wishlist</p>
                <h2 className="text-xl font-black">{selectedProfile.displayName}</h2>
              </div>
              <Button type="button" variant="ghost" onClick={() => setShareOpen(false)} aria-label="Close">
                <X size={16} />
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <button type="button" className={`rounded-2xl p-3 text-sm font-black ${shareTargetType === "person" ? "bg-mint text-spruce" : "bg-cloud text-ink/60"}`} onClick={() => setShareTargetType("person")}>Person</button>
                <button type="button" className={`rounded-2xl p-3 text-sm font-black ${shareTargetType === "group" ? "bg-mint text-spruce" : "bg-cloud text-ink/60"}`} onClick={() => setShareTargetType("group")}>Group</button>
                <button type="button" className={`rounded-2xl p-3 text-sm font-black ${shareTargetType === "invite" ? "bg-mint text-spruce" : "bg-cloud text-ink/60"}`} onClick={() => setShareTargetType("invite")}>Invite</button>
              </div>
              {shareTargetType === "person" ? (
                <Field label="Share with person">
                  <Select value={shareConnectionId} onChange={(event) => setShareConnectionId(event.target.value)}>
                    <option value="">Choose someone</option>
                    {connections.map((connection) => <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>)}
                  </Select>
                </Field>
              ) : null}
              {shareTargetType === "group" ? (
                <Field label="Share with group">
                  <Select value={shareGroupId} onChange={(event) => setShareGroupId(event.target.value)}>
                    <option value="">Choose a group</option>
                    {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                  </Select>
                </Field>
              ) : null}
              {shareTargetType === "invite" ? (
                <Field label="Invite by email or phone">
                  <Input value={inviteValue} onChange={(event) => setInviteValue(event.target.value)} placeholder="name@example.com or mobile" />
                </Field>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" onClick={saveShare}>
                  <Share2 size={16} />
                  Share wishlist
                </Button>
                <Button type="button" variant="ghost" onClick={copyShareLink}>
                  <Copy size={16} />
                  Copy public link
                </Button>
              </div>
              {wishlistShares.filter((share) => share.profileId === selectedProfile.id).length ? (
                <p className="rounded-2xl bg-cloud p-3 text-xs font-bold text-ink/55">
                  {wishlistShares.filter((share) => share.profileId === selectedProfile.id).length} active share grant.
                </p>
              ) : null}
              {shareMessage ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{shareMessage}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
