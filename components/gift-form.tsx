"use client";

import { useState } from "react";
import { ChevronDown, Save, Search, X } from "lucide-react";
import { eventTags, type EventTag, type GiftItem, type Visibility } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "./ui";

type GiftFormProps = {
  profileId: string;
  gift?: GiftItem;
  onSave: (gift: GiftItem) => void;
  onCancel: () => void;
};

export function GiftForm({ profileId, gift, onSave, onCancel }: GiftFormProps) {
  const [allowContributions, setAllowContributions] = useState(gift?.allowContributions ?? false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState("");
  const [form, setForm] = useState({
    title: gift?.title ?? "",
    productUrl: gift?.productUrl ?? "",
    imageUrl: gift?.imageUrl ?? "",
    price: gift?.price.toString() ?? "",
    storeName: gift?.storeName ?? "",
    currency: gift?.currency ?? "USD",
    notes: gift?.notes ?? "",
    eventTag: gift?.eventTag ?? "General Wishlist",
    wantRating: String(gift?.wantRating ?? 3),
    visibility: gift?.visibility ?? "public",
    hiddenFromRecipient: gift?.hiddenFromRecipient ?? false,
    fundingGoalAmount: gift?.fundingGoalAmount.toString() ?? ""
  });

  function update(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function fetchDetails() {
    setMetadataMessage("");
    if (!form.productUrl.trim()) {
      setMetadataMessage("Paste a product link first.");
      return;
    }

    setFetchingMetadata(true);
    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: form.productUrl })
      });
      const metadata = await response.json();
      setForm((current) => ({
        ...current,
        title: metadata.title || current.title,
        productUrl: metadata.canonicalUrl || current.productUrl,
        imageUrl: metadata.imageUrl || current.imageUrl,
        storeName: metadata.storeName || metadata.siteName || current.storeName,
        price: metadata.price ? String(metadata.price) : current.price,
        currency: metadata.currency || current.currency
      }));
      setMetadataMessage(metadata.error || "Gift details filled in. You can edit anything before saving.");
    } catch {
      setMetadataMessage("We couldn't pull details from this site. You can still add it manually.");
    } finally {
      setFetchingMetadata(false);
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const stamp = new Date().toISOString();
    const productUrl = form.productUrl.trim();
    onSave({
      id: gift?.id ?? `gift_${crypto.randomUUID()}`,
      profileId,
      createdByUserId: gift?.createdByUserId ?? "current_user",
      title: form.title || "Untitled gift",
      productUrl,
      originalUrl: gift?.originalUrl ?? productUrl,
      affiliateUrl: gift?.affiliateUrl,
      monetizedUrl: gift?.monetizedUrl ?? productUrl,
      affiliateStatus: gift?.affiliateStatus ?? "not_checked",
      storeName: form.storeName || "Unknown store",
      imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
      price: Number(form.price || 0),
      currency: form.currency || "USD",
      notes: form.notes,
      eventTag: form.eventTag as EventTag,
      wantRating: Number(form.wantRating) as GiftItem["wantRating"],
      visibility: form.visibility as Visibility,
      hiddenFromRecipient: form.hiddenFromRecipient,
      allowContributions,
      fundingGoalAmount: allowContributions ? Number(form.fundingGoalAmount || form.price || 0) : 0,
      currentContributionAmount: gift?.currentContributionAmount ?? 0,
      reservedStatus: gift?.reservedStatus ?? "available",
      reservedBy: gift?.reservedBy,
      purchasedStatus: gift?.purchasedStatus ?? false,
      createdAt: gift?.createdAt ?? stamp,
      updatedAt: stamp
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{gift ? "Edit Gift" : "Add Gift"}</h2>
        <Button type="button" variant="ghost" onClick={onCancel} aria-label="Close form">
          <X size={16} />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Paste product link">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input required type="url" value={form.productUrl} onChange={(event) => update("productUrl", event.target.value)} />
              <Button type="button" variant="secondary" onClick={fetchDetails} disabled={fetchingMetadata}>
                <Search size={16} />
                {fetchingMetadata ? "Fetching..." : "Fetch details"}
              </Button>
            </div>
          </Field>
          {fetchingMetadata ? <p className="mt-2 text-sm font-bold text-ink/55">Fetching gift details...</p> : null}
          {metadataMessage ? <p className="mt-2 text-sm font-bold text-ink/60">{metadataMessage}</p> : null}
        </div>
        <Field label="Product name">
          <Input required value={form.title} onChange={(event) => update("title", event.target.value)} />
        </Field>
        <Field label="Event">
          <Select value={form.eventTag} onChange={(event) => update("eventTag", event.target.value)}>
            {eventTags.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </Select>
        </Field>
        <Field label="Want rating">
          <Select value={form.wantRating} onChange={(event) => update("wantRating", event.target.value)}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating} hearts
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Visibility">
          <Select value={form.visibility} onChange={(event) => update("visibility", event.target.value)}>
            <option value="private">Private</option>
            <option value="shared">Shared</option>
            <option value="public">Public</option>
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} />
      </Field>
      <div className="rounded-3xl bg-cloud p-4">
        <button
          type="button"
          className="focus-ring flex w-full items-center justify-between rounded-2xl bg-white px-3 py-2 text-left text-sm font-black text-ink"
          onClick={() => setShowAdvanced((value) => !value)}
        >
          Advanced details
          <ChevronDown className={`transition ${showAdvanced ? "rotate-180" : ""}`} size={16} />
        </button>
        {showAdvanced ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Image URL">
              <Input value={form.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} />
            </Field>
            <Field label="Store name">
              <Input value={form.storeName} onChange={(event) => update("storeName", event.target.value)} />
            </Field>
            <Field label="Price">
              <Input inputMode="decimal" value={form.price} onChange={(event) => update("price", event.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
            </Field>
          </div>
        ) : null}
      </div>
      <div className="grid gap-3 rounded-3xl bg-cloud p-4 sm:grid-cols-2">
        <label className="flex items-center gap-3 text-sm font-black">
          <input
            type="checkbox"
            checked={form.hiddenFromRecipient}
            onChange={(event) => update("hiddenFromRecipient", event.target.checked)}
          />
          Hidden from recipient
        </label>
        <label className="flex items-center gap-3 text-sm font-black">
          <input
            type="checkbox"
            checked={allowContributions}
            onChange={(event) => setAllowContributions(event.target.checked)}
          />
          Allow contributions
        </label>
      </div>
      {allowContributions ? (
        <Field label="Funding goal amount">
          <Input inputMode="decimal" value={form.fundingGoalAmount} onChange={(event) => update("fundingGoalAmount", event.target.value)} />
        </Field>
      ) : null}
      <Button type="submit">
        <Save size={16} />
        Save Gift
      </Button>
    </form>
  );
}
