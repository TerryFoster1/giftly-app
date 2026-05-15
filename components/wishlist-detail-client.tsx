"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { eventTags, type GiftItem, type Visibility } from "@/lib/types";
import { normalizeProductUrl } from "@/lib/product-url";
import { publicProfilePath } from "@/lib/url";
import { GiftCard } from "./gift-card";
import { GiftForm } from "./gift-form";
import { Button, Field, Input, Select } from "./ui";

const fallbackImage = "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop";

type MetadataResult = {
  title?: string;
  imageUrl?: string;
  storeName?: string;
  siteName?: string;
  price?: string | number;
  currency?: string;
  canonicalUrl?: string;
};

function priceAmount(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function storeFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Saved link";
  }
}

export function WishlistDetailClient({ slug }: { slug: string }) {
  const { user, profiles, gifts, ready, actionError, actions } = useGiftlyStore();
  const [eventFilter, setEventFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility | "All">("All");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState<GiftItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [fastUrl, setFastUrl] = useState("");
  const [fastError, setFastError] = useState("");
  const [fastModalOpen, setFastModalOpen] = useState(false);
  const [fastSaving, setFastSaving] = useState(false);
  const [fastVisibility, setFastVisibility] = useState<"private" | "shared">("private");

  const selectedProfile = useMemo(() => profiles.find((profile) => profile.slug === slug), [profiles, slug]);
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

  function openFastAdd() {
    setFastError("");
    const normalized = normalizeProductUrl(fastUrl);
    if (normalized.error || !normalized.url) {
      setFastError(normalized.error ?? "Please paste the full product link, starting with https://");
      return;
    }
    setFastUrl(normalized.url);
    setFastModalOpen(true);
  }

  async function fetchMetadata(url: string): Promise<MetadataResult> {
    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      return (await response.json()) as MetadataResult;
    } catch {
      return {};
    }
  }

  async function saveFastGift() {
    setFastError("");
    const normalized = normalizeProductUrl(fastUrl);
    if (normalized.error || !normalized.url) {
      setFastError(normalized.error ?? "Please paste the full product link, starting with https://");
      return;
    }
    if (!selectedProfile) {
      setFastError("Choose a wishlist first.");
      return;
    }

    setFastSaving(true);
    try {
      const metadata = await fetchMetadata(normalized.url);
      const stamp = new Date().toISOString();
      const productUrl = metadata.canonicalUrl || normalized.url;
      const price = priceAmount(metadata.price);
      const savedGift: GiftItem = {
        id: `gift_${crypto.randomUUID()}`,
        profileId: selectedProfile.id,
        createdByUserId: user?.id ?? "current_user",
        title: metadata.title || "Gift idea",
        productUrl,
        originalUrl: normalized.url,
        affiliateUrl: undefined,
        monetizedUrl: productUrl,
        affiliateStatus: "not_checked",
        storeName: metadata.storeName || metadata.siteName || storeFromUrl(productUrl),
        imageUrl: metadata.imageUrl || fallbackImage,
        price,
        originalPrice: price,
        currentPrice: price,
        estimatedTotalCost: price,
        currency: (metadata.currency || "").trim().toUpperCase(),
        notes: "",
        eventTag: "General Wishlist",
        wantRating: 3,
        visibility: fastVisibility,
        hiddenFromRecipient: false,
        allowContributions: false,
        fundingGoalAmount: 0,
        currentContributionAmount: 0,
        reservedStatus: "available",
        purchasedStatus: false,
        createdAt: stamp,
        updatedAt: stamp
      };
      await actions.saveGift(savedGift);
      await actions.refresh();
      setFastModalOpen(false);
      setFastUrl("");
      setGiftMessage("Gift saved.");
    } catch (error) {
      setFastError(error instanceof Error ? error.message : "Gift could not be saved.");
    } finally {
      setFastSaving(false);
    }
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
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
      <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-black text-spruce underline" href="/dashboard">
              Back to dashboard
            </Link>
            <p className="mt-4 text-sm font-black uppercase text-berry">Wishlist</p>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">{selectedProfile.displayName}</h1>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-ink/60">
              Browse saved gift ideas, compare priorities, and keep this list ready to share when someone asks.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link className="text-sm font-black text-spruce underline" href={publicProfilePath(selectedProfile.slug)}>
              View public profile
            </Link>
            <Button type="button" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={16} />
              Add gift
            </Button>
          </div>
        </div>
        <div className="grid gap-3 rounded-3xl bg-cloud p-3 sm:grid-cols-[1fr_auto]">
          <Input aria-label="Product link" placeholder="Paste a product link" type="text" value={fastUrl} onChange={(event) => setFastUrl(event.target.value)} />
          <Button type="button" onClick={openFastAdd}>
            <Plus size={16} />
            Quick add
          </Button>
        </div>
        {fastError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{fastError}</p> : null}
      </section>

      {giftMessage ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{giftMessage}</p> : null}
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}

      <section className="grid gap-4">
        <div className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm sm:grid-cols-3">
          <Select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
            <option>All events</option>
            {eventTags.map((tag) => <option key={tag}>{tag}</option>)}
          </Select>
          <Select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as Visibility | "All")}>
            <option>All visibility</option>
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

        {showForm || editing ? (
          <GiftForm
            profileId={selectedProfile.id}
            gift={editing ?? undefined}
            onSave={saveGift}
            onCancel={() => { setEditing(null); setShowForm(false); }}
          />
        ) : null}

        {visibleGifts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {fastModalOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-[2rem] bg-white p-4 shadow-soft sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Add to wishlist</h2>
              <Button type="button" variant="ghost" onClick={() => setFastModalOpen(false)} aria-label="Close">
                <X size={16} />
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="List privacy">
                <Select value={fastVisibility} onChange={(event) => setFastVisibility(event.target.value as "private" | "shared")}>
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                </Select>
              </Field>
              <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/60">
                Future: shared lists can be limited to groups like Family or Close Friends, with product-level exclusions.
              </p>
              {fastError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{fastError}</p> : null}
              <Button type="button" onClick={saveFastGift} disabled={fastSaving}>
                {fastSaving ? "Saving..." : "Save gift"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
