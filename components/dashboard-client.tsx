"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Plus, Share2, Sparkles, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { getUpcomingProfileEvents } from "@/lib/events";
import { type GiftItem, type GroupLabel, type Profile, type RecommendedProduct } from "@/lib/types";
import { normalizeProductUrl } from "@/lib/product-url";
import { publicProfileUrl } from "@/lib/url";
import { InviteModal } from "./invite-modal";
import { OnboardingCard } from "./onboarding-card";
import { Button, Field, Input, Select } from "./ui";

const fallbackImage = "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop";
const foundationGiftGroups = [
  {
    title: "Family",
    description: "Share wishlists and birthdays with the people who buy for each other most often.",
    tone: "bg-mint text-spruce"
  },
  {
    title: "Friends",
    description: "Save birthday ideas, group plans, and gift inspiration for close friends.",
    tone: "bg-cloud text-ink"
  }
];

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

function wishlistVisibility(profile: Profile, gifts: GiftItem[]) {
  const profileGifts = gifts.filter((gift) => gift.profileId === profile.id);
  if (profile.listVisibility === "shared") return "shared";
  return profileGifts.some((gift) => gift.visibility !== "private") ? "shared" : "private";
}

function titleCaseGroup(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isDemoGroupName(value: string) {
  const normalized = value.trim().toLowerCase();
  return ["wedding", "household", "kids", "couples", "brian and becky's wedding", "brian & becky's wedding"].includes(normalized);
}

export function DashboardClient() {
  const { user, profiles, gifts, connections = [], ready, actionError, actions } = useGiftlyStore();
  const [giftMessage, setGiftMessage] = useState("");
  const [fastUrl, setFastUrl] = useState("");
  const [fastError, setFastError] = useState("");
  const [fastModalOpen, setFastModalOpen] = useState(false);
  const [fastSaving, setFastSaving] = useState(false);
  const [fastProfileId, setFastProfileId] = useState("");
  const [fastVisibility, setFastVisibility] = useState<"private" | "shared">("private");
  const [createNewList, setCreateNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [createListOpen, setCreateListOpen] = useState(false);
  const [standaloneListName, setStandaloneListName] = useState("");
  const [standaloneListVisibility, setStandaloneListVisibility] = useState<"private" | "shared">("shared");
  const [createListSaving, setCreateListSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareInitialMode, setShareInitialMode] = useState<"existing" | "new">("existing");
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);

  const primaryProfile = profiles.find((profile) => profile.isPrimary) ?? profiles[0];
  const upcomingEvents = useMemo(() => getUpcomingProfileEvents(profiles).slice(0, 3), [profiles]);
  const existingGroupNames = useMemo(
    () =>
      Array.from(
        new Set(
          connections
            .map((connection) => connection.customGroupLabel || titleCaseGroup(connection.groupLabel))
            .filter((group): group is string => Boolean(group) && !isDemoGroupName(group))
        )
      ),
    [connections]
  );
  const giftGroups = useMemo(() => {
    return foundationGiftGroups.map((group) => ({
      ...group,
      count:
        connections.filter((connection) => (connection.customGroupLabel || titleCaseGroup(connection.groupLabel)) === group.title).length ||
        (group.title === "Family" ? profiles.length : 0)
    }));
  }, [connections, profiles.length]);

  useEffect(() => {
    fetch("/api/recommended-products", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : []))
      .then((products: RecommendedProduct[]) => setRecommendedProducts(products))
      .catch(() => setRecommendedProducts([]));
  }, []);

  function openFastAdd() {
    setFastError("");
    const normalized = normalizeProductUrl(fastUrl);
    if (normalized.error || !normalized.url) {
      setFastError(normalized.error ?? "Please paste the full product link, starting with https://");
      return;
    }
    setFastUrl(normalized.url);
    setFastProfileId(primaryProfile?.id ?? profiles[0]?.id ?? "");
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
    if (createNewList && !newListName.trim()) {
      setFastError("Name the new wishlist first.");
      return;
    }
    if (!createNewList && !fastProfileId) {
      setFastError("Choose a wishlist first.");
      return;
    }

    setFastSaving(true);
    try {
      const targetProfile = createNewList
        ? await actions.createProfile({
            displayName: newListName.trim(),
            relationship: "Wishlist",
            bio: "",
            photoUrl: "",
            birthday: "",
            anniversary: "",
            groupLabel: "FAMILY",
            listVisibility: fastVisibility
          })
        : profiles.find((profile) => profile.id === fastProfileId);

      if (!targetProfile) throw new Error("Choose a wishlist first.");

      const metadata = await fetchMetadata(normalized.url);
      const stamp = new Date().toISOString();
      const productUrl = metadata.canonicalUrl || normalized.url;
      const price = priceAmount(metadata.price);
      const savedGift: GiftItem = {
        id: `gift_${crypto.randomUUID()}`,
        profileId: targetProfile.id,
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
      setCreateNewList(false);
      setNewListName("");
      setFastUrl("");
      setGiftMessage("Gift saved.");
    } catch (error) {
      setFastError(error instanceof Error ? error.message : "Gift could not be saved.");
    } finally {
      setFastSaving(false);
    }
  }

  async function saveInvite(input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string }) {
    await actions.createConnection(input);
    await actions.refresh();
  }

  function openShareModal(mode: "existing" | "new" = "existing") {
    setShareInitialMode(mode);
    setShareOpen(true);
  }

  async function createStandaloneWishlist() {
    setFastError("");
    if (!standaloneListName.trim()) {
      setFastError("Name the new wishlist first.");
      return;
    }

    setCreateListSaving(true);
    try {
      const created = await actions.createProfile({
        displayName: standaloneListName.trim(),
        relationship: "Wishlist",
        bio: "",
        photoUrl: "",
        birthday: "",
        anniversary: "",
        groupLabel: "FAMILY",
        listVisibility: standaloneListVisibility
      });
      await actions.refresh();
      setCreateListOpen(false);
      setStandaloneListName("");
      setStandaloneListVisibility("shared");
      setGiftMessage(`${created.displayName} created.`);
    } catch (error) {
      setFastError(error instanceof Error ? error.message : "Wishlist could not be created.");
    } finally {
      setCreateListSaving(false);
    }
  }

  if (!ready) {
    return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading Giftly...</main>;
  }

  if (!profiles.length) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">
          {actionError || "No profiles are available yet."}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <section className="grid gap-5 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <div className="grid gap-3">
          <p className="text-sm font-black uppercase text-berry">Gift notepad</p>
          <h1 className="text-3xl font-black leading-tight sm:text-5xl">Save the gift idea before it disappears.</h1>
          <p className="max-w-2xl text-sm font-semibold leading-6 text-ink/65 sm:text-base">
            Paste any product link, drop it into the right wishlist, and keep a simple place for gift inspiration all year.
          </p>
        </div>
        <div className="grid gap-3 rounded-3xl bg-cloud p-3 sm:grid-cols-[1fr_auto]">
          <Input
            aria-label="Product link"
            placeholder="Paste a product link"
            type="text"
            value={fastUrl}
            onChange={(event) => setFastUrl(event.target.value)}
          />
          <Button type="button" onClick={openFastAdd}>
            <Plus size={16} />
            Add
          </Button>
        </div>
        {fastError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{fastError}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => openShareModal("existing")}>
            <Share2 size={16} />
            Share your Giftly profile
          </Button>
          <Button type="button" variant="ghost" onClick={() => openShareModal("existing")}>
            <UsersRound size={16} />
            Invite family members
          </Button>
        </div>
      </section>

      {giftMessage ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{giftMessage}</p> : null}
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}

      <OnboardingCard
        userName={user?.name}
        wishlistCount={profiles.length}
        onCreateWishlist={() => setCreateListOpen(true)}
        onInvite={() => openShareModal("existing")}
      />

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-berry">My Wishlists</p>
            <h2 className="text-2xl font-black">Saved gift ideas</h2>
          </div>
          <Link className="text-sm font-black text-spruce underline" href="/profiles">
            Manage
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const profileGifts = gifts.filter((gift) => gift.profileId === profile.id);
            const previews = profileGifts.slice(0, 4);
            const status = wishlistVisibility(profile, gifts);
            return (
              <Link
                className="focus-ring grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
                href={`/profiles/${profile.slug}`}
                key={profile.id}
              >
                <div className="grid aspect-[4/3] grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-cloud">
                  {[0, 1, 2, 3].map((index) =>
                    previews[index] ? (
                      <img key={previews[index].id} src={previews[index].imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div key={index} className="grid place-items-center bg-blush text-xs font-black text-berry">
                        Giftly
                      </div>
                    )
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black">{profile.displayName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-ink/55">
                      {profileGifts.length} {profileGifts.length === 1 ? "item" : "items"}
                    </p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black capitalize ${status === "shared" ? "bg-mint text-spruce" : "bg-cloud text-ink/60"}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
          <button
            type="button"
            className="focus-ring grid gap-3 rounded-[1.5rem] border border-dashed border-ink/20 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
            onClick={() => {
              setFastError("");
              setCreateListOpen(true);
            }}
          >
            <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-cloud text-berry">
              <Plus size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black">Add New List</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">Start a wishlist for an event, person, or idea you want to remember.</p>
            </div>
            <span className="w-fit rounded-full bg-blush px-3 py-1 text-xs font-black text-berry">Create list</span>
          </button>
        </div>
      </section>

      {upcomingEvents.length ? (
        <section className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-berry" />
            <p className="text-sm font-black uppercase text-berry">Upcoming Events</p>
          </div>
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
          <p className="mt-3 text-xs font-bold leading-5 text-ink/55">
            Giftly will later include events from shared gift groups and connected people.
          </p>
        </section>
      ) : null}

      <section className="grid gap-3">
        <div>
          <p className="text-sm font-black uppercase text-berry">My Gift Groups</p>
          <h2 className="text-2xl font-black">Plan gifts with your people</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {giftGroups.map((group) => (
            <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" key={group.title}>
              <div className="grid aspect-[4/3] grid-cols-2 gap-1 overflow-hidden rounded-2xl bg-cloud">
                {[0, 1, 2, 3].map((index) => (
                  <div className={`grid place-items-center ${index === 0 ? group.tone : "bg-blush text-berry"}`} key={index}>
                    {index === 0 ? <UsersRound size={22} /> : <span className="text-xs font-black">Giftly</span>}
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-black">{group.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">{group.description}</p>
              </div>
              <p className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-ink/60">
                {group.count ? `${group.count} connected ${group.count === 1 ? "person" : "people"}` : "Shared event ready"}
              </p>
              <Button type="button" variant="ghost" onClick={() => openShareModal("existing")}>
                <Share2 size={16} />
                Invite
              </Button>
            </article>
          ))}
          <button
            type="button"
            className="focus-ring grid gap-3 rounded-[1.5rem] border border-dashed border-ink/20 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft"
            onClick={() => openShareModal("new")}
          >
            <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-cloud text-berry">
              <Plus size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black">Add Group</h3>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">Create your own group for shared wishlists and events.</p>
            </div>
            <span className="rounded-full bg-blush px-3 py-1 text-xs font-black text-berry">Create group</span>
          </button>
        </div>
      </section>

      <section className="grid gap-3 rounded-[2rem] border border-dashed border-ink/15 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-berry" />
          <h2 className="text-xl font-black">Recommended gift ideas</h2>
        </div>
        <p className="text-sm font-semibold leading-6 text-ink/60">
          Discover thoughtful gifts for upcoming events, shared wishlists, and the people you plan for most.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedProducts.length ? (
            recommendedProducts.slice(0, 6).map((product) => (
              <article className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm" key={product.id}>
                <img src={product.imageUrl} alt="" className="aspect-[5/3] w-full object-cover" />
                <div className="grid gap-2 p-3">
                  <div>
                    <p className="text-xs font-black uppercase text-berry">{product.category || "Gift idea"}</p>
                    <h3 className="font-black leading-tight">{product.title}</h3>
                    <p className="text-xs font-bold text-ink/55">
                      {product.storeName} {product.price ? `/ ${product.currency ? `${product.currency} ` : ""}$${product.price.toFixed(2)}` : ""}
                    </p>
                  </div>
                  <p className="text-xs font-semibold leading-5 text-ink/60">{product.description}</p>
                  <a
                    className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl bg-coral px-3 text-xs font-black text-white hover:bg-berry"
                    href={product.affiliateUrl || product.originalUrl}
                    target="_blank"
                  >
                    <ExternalLink size={13} />
                    Buy Now
                  </a>
                </div>
              </article>
            ))
          ) : (
            ["For birthdays", "For weddings", "Popular saves"].map((label) => (
              <div className="rounded-2xl bg-cloud p-3 text-sm font-black text-ink/65" key={label}>
                {label}
              </div>
            ))
          )}
        </div>
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
              <label className="flex items-center gap-3 text-sm font-black">
                <input type="radio" checked={!createNewList} onChange={() => setCreateNewList(false)} />
                Select existing wishlist
              </label>
              {!createNewList ? (
                <Select value={fastProfileId} onChange={(event) => setFastProfileId(event.target.value)}>
                  {profiles.map((profile) => (
                    <option value={profile.id} key={profile.id}>{profile.displayName}</option>
                  ))}
                </Select>
              ) : null}
              <label className="flex items-center gap-3 text-sm font-black">
                <input type="radio" checked={createNewList} onChange={() => setCreateNewList(true)} />
                Create new wishlist
              </label>
              {createNewList ? (
                <Field label="New wishlist name">
                  <Input value={newListName} onChange={(event) => setNewListName(event.target.value)} />
                </Field>
              ) : null}
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

      {createListOpen ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-[2rem] bg-white p-4 shadow-soft sm:rounded-[2rem]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-berry">New wishlist</p>
                <h2 className="text-xl font-black">Create a list</h2>
              </div>
              <Button type="button" variant="ghost" onClick={() => setCreateListOpen(false)} aria-label="Close">
                <X size={16} />
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="List title">
                <Input
                  placeholder="My Birthday"
                  value={standaloneListName}
                  onChange={(event) => setStandaloneListName(event.target.value)}
                />
              </Field>
              <Field label="List privacy">
                <Select value={standaloneListVisibility} onChange={(event) => setStandaloneListVisibility(event.target.value as "private" | "shared")}>
                  <option value="shared">Shared</option>
                  <option value="private">Private</option>
                </Select>
              </Field>
              <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/60">
                Group selection is coming later. For now, shared lists are ready for your public Giftly profile and private lists stay personal.
              </p>
              {fastError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{fastError}</p> : null}
              <Button type="button" onClick={createStandaloneWishlist} disabled={createListSaving}>
                {createListSaving ? "Creating..." : "Create list"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <InviteModal
        open={shareOpen && Boolean(primaryProfile)}
        title="Share your Giftly profile"
        profileUrl={primaryProfile ? publicProfileUrl(primaryProfile.slug) : ""}
        existingGroups={existingGroupNames}
        initialMode={shareInitialMode}
        onClose={() => setShareOpen(false)}
        onInvite={saveInvite}
      />
    </main>
  );
}
