"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Save, X } from "lucide-react";
import { eventTags, type EventTag, type GiftItem, type Visibility } from "@/lib/types";
import { isAmazonUrl, normalizeProductUrl } from "@/lib/product-url";
import { Button, Field, Input, Select, Textarea } from "./ui";

type GiftFormProps = {
  profileId: string;
  gift?: GiftItem;
  onSave: (gift: GiftItem) => void | Promise<void>;
  onCancel: () => void;
};

export function GiftForm({ profileId, gift, onSave, onCancel }: GiftFormProps) {
  const [allowContributions, setAllowContributions] = useState(gift?.allowContributions ?? false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [metadataMessage, setMetadataMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [urlError, setUrlError] = useState("");
  const lastFetchedUrl = useRef("");
  const [form, setForm] = useState({
    title: gift?.title ?? "",
    productUrl: gift?.productUrl ?? "",
    imageUrl: gift?.imageUrl ?? "",
    price: gift?.price.toString() ?? "",
    shippingCost: gift?.shippingCost?.toString() ?? "",
    priceSourceUrl: gift?.priceSourceUrl ?? "",
    storeName: gift?.storeName ?? "",
    currency: gift?.currency ?? "",
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

  function amount(value: string) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  async function fetchDetails(url: string) {
    setMetadataMessage("");
    setUrlError("");
    const normalized = normalizeProductUrl(url);
    if (normalized.error || !normalized.url) {
      setUrlError(normalized.error ?? "Please paste the full product link, starting with https://");
      return;
    }
    const shouldPreserveOriginalUrl = isAmazonUrl(normalized.url);
    lastFetchedUrl.current = normalized.url;

    setFetchingMetadata(true);
    try {
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: normalized.url })
      });
      const metadata = await response.json();
      const metadataError = metadata.error && !metadata.title;
      setForm((current) => ({
        ...current,
        title: metadata.title || current.title,
        productUrl: shouldPreserveOriginalUrl ? normalized.url : metadata.canonicalUrl || normalized.url,
        imageUrl: metadata.imageUrl || current.imageUrl,
        storeName: metadata.storeName || metadata.siteName || current.storeName,
        price: metadata.price ? String(metadata.price) : current.price,
        currency: metadata.currency ?? current.currency,
        priceSourceUrl: metadata.canonicalUrl || current.priceSourceUrl
      }));
      setMetadataMessage(metadataError ? "Couldn't fetch details, add manually." : metadata.error || "Gift details filled in. You can edit anything before saving.");
    } catch {
      setMetadataMessage("Couldn't fetch details, add manually.");
    } finally {
      setFetchingMetadata(false);
    }
  }

  useEffect(() => {
    if (gift) return;
    const rawUrl = form.productUrl.trim();
    if (!rawUrl) {
      setUrlError("");
      setMetadataMessage("");
      return;
    }

    const normalized = normalizeProductUrl(rawUrl);
    if (normalized.error || !normalized.url) return;
    if (normalized.url === lastFetchedUrl.current) return;

    const timer = window.setTimeout(() => {
      fetchDetails(normalized.url);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [form.productUrl, gift]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaveError("");
    setUrlError("");
    const normalized = normalizeProductUrl(form.productUrl);
    if (normalized.error || !normalized.url) {
      setUrlError(normalized.error ?? "Please paste the full product link, starting with https://");
      return;
    }
    if (!form.title.trim()) {
      setSaveError("Add a product name before saving.");
      setMetadataMessage("Couldn't fetch details, add manually.");
      return;
    }
    const stamp = new Date().toISOString();
    const productUrl = normalized.url;
    setSaving(true);
    try {
      await onSave({
        id: gift?.id ?? `gift_${crypto.randomUUID()}`,
        profileId,
        createdByUserId: gift?.createdByUserId ?? "current_user",
        title: form.title.trim(),
        productUrl,
        originalUrl: gift?.originalUrl ?? productUrl,
        affiliateUrl: gift?.affiliateUrl,
        monetizedUrl: gift?.monetizedUrl ?? productUrl,
        affiliateStatus: gift?.affiliateStatus ?? "not_checked",
        storeName: form.storeName || "Unknown store",
        imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
        price: amount(form.price),
        originalPrice: gift?.originalPrice ?? amount(form.price),
        currentPrice: amount(form.price),
        shippingCost: form.shippingCost ? amount(form.shippingCost) : gift?.shippingCost,
        estimatedTotalCost: amount(form.price) + amount(form.shippingCost),
        priceSourceUrl: form.priceSourceUrl || form.productUrl || undefined,
        bestFoundPrice: gift?.bestFoundPrice,
        bestFoundTotalCost: gift?.bestFoundTotalCost,
        bestFoundStoreName: gift?.bestFoundStoreName,
        priceLastCheckedAt: gift?.priceLastCheckedAt,
        currency: form.currency.trim().toUpperCase(),
        notes: form.notes,
        eventTag: form.eventTag as EventTag,
        wantRating: Number(form.wantRating) as GiftItem["wantRating"],
        visibility: form.visibility as Visibility,
        hiddenFromRecipient: form.hiddenFromRecipient,
        allowContributions,
        fundingGoalAmount: allowContributions ? amount(form.fundingGoalAmount || form.price) : 0,
        currentContributionAmount: gift?.currentContributionAmount ?? 0,
        reservedStatus: gift?.reservedStatus ?? "available",
        reservedBy: gift?.reservedBy,
        purchasedStatus: gift?.purchasedStatus ?? false,
        createdAt: gift?.createdAt ?? stamp,
        updatedAt: stamp
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Gift could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
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
            <Input required type="text" value={form.productUrl} onChange={(event) => update("productUrl", event.target.value)} />
          </Field>
          {urlError ? <p className="mt-2 text-sm font-bold text-berry">{urlError}</p> : null}
          {fetchingMetadata ? <p className="mt-2 text-sm font-bold text-ink/55">Fetching gift details...</p> : null}
          {metadataMessage ? <p className="mt-2 text-sm font-bold text-ink/60">{metadataMessage}</p> : null}
        </div>
        <Field label="Product name">
          <Input required value={form.title} onChange={(event) => update("title", event.target.value)} />
        </Field>
        <Field label="Price">
          <Input inputMode="decimal" value={form.price} onChange={(event) => update("price", event.target.value)} />
        </Field>
        <Field label="Currency">
          <Input value={form.currency} onChange={(event) => update("currency", event.target.value.toUpperCase())} />
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
        <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/60 sm:col-span-2">
          Future: Giftly can check for a better total price, including shipping.
        </p>
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
            <Field label="Shipping cost">
              <Input inputMode="decimal" value={form.shippingCost} onChange={(event) => update("shippingCost", event.target.value)} />
            </Field>
            <Field label="Price source URL">
              <Input type="url" value={form.priceSourceUrl} onChange={(event) => update("priceSourceUrl", event.target.value)} />
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
      {saveError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{saveError}</p> : null}
      <Button type="submit" disabled={saving}>
        <Save size={16} />
        {saving ? "Saving..." : "Save Gift"}
      </Button>
    </form>
  );
}
