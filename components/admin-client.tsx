"use client";

import { BarChart3, Edit3, ExternalLink, Link2, PackagePlus, Search, ShieldCheck, Trash2, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeProductUrl } from "@/lib/product-url";
import type { AdminOverview, AffiliateProgram, RecommendedAffiliateStatus, RecommendedProduct } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "./ui";

type AdminSection = "users" | "gifts" | "wishlists" | "recommended" | "affiliate" | "unmatched" | "analytics";
type UserFilter = "all" | "admins" | "has_gifts" | "no_gifts";
type ProductFilter = "all" | "active" | "inactive" | "affiliate_missing" | "affiliate_ready";
type MetadataResult = {
  title?: string;
  description?: string;
  imageUrl?: string;
  storeName?: string;
  siteName?: string;
  price?: string | number;
  currency?: string;
  canonicalUrl?: string;
  error?: string;
};

const blankProduct: RecommendedProduct = {
  id: "",
  title: "",
  description: "",
  imageUrl: "",
  originalUrl: "",
  affiliateUrl: "",
  affiliateProgram: "",
  affiliateStatus: "none",
  affiliateNotes: "",
  price: 0,
  currency: "",
  storeName: "",
  category: "",
  tags: "",
  targetAudienceNotes: "",
  active: true,
  featured: false,
  hot: false,
  seasonal: false,
  createdAt: "",
  updatedAt: ""
};

const blankAffiliate: AffiliateProgram = {
  id: "",
  name: "Amazon Associates",
  trackingId: "",
  defaultDomain: "amazon.com",
  notes: "",
  active: true,
  createdAt: "",
  updatedAt: ""
};

function priceLabel(product: Pick<RecommendedProduct, "price" | "currency">) {
  if (!product.price) return "Price not set";
  return `${product.currency ? `${product.currency} ` : ""}$${product.price.toFixed(2)}`;
}

function includesQuery(values: Array<string | number | boolean | undefined>, query: string) {
  if (!query) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(query));
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    mode: "same-origin",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Admin request failed.");
  return body as T;
}

export function AdminClient() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection | null>(null);
  const [productForm, setProductForm] = useState<RecommendedProduct>(blankProduct);
  const [affiliateForm, setAffiliateForm] = useState<AffiliateProgram>(blankAffiliate);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingProductMetadata, setFetchingProductMetadata] = useState(false);
  const [productMetadataMessage, setProductMetadataMessage] = useState("");
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const lastFetchedProductUrl = useRef("");

  async function refresh() {
    setError("");
    try {
      setOverview(await requestJson<AdminOverview>("/api/admin/overview"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin data could not be loaded.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (activeSection !== "recommended" || productForm.id) return;
    const rawUrl = productForm.originalUrl.trim();
    if (!rawUrl) {
      setProductMetadataMessage("");
      return;
    }

    const normalized = normalizeProductUrl(rawUrl);
    if (normalized.error || !normalized.url) return;
    if (normalized.url === lastFetchedProductUrl.current) return;

    const timer = window.setTimeout(async () => {
      setFetchingProductMetadata(true);
      setProductMetadataMessage("Fetching product details...");
      lastFetchedProductUrl.current = normalized.url;
      try {
        const metadata = await requestJson<MetadataResult>("/api/metadata", {
          method: "POST",
          body: JSON.stringify({ url: normalized.url })
        });
        setProductForm((current) => ({
          ...current,
          title: metadata.title || current.title,
          description: metadata.description || current.description,
          imageUrl: metadata.imageUrl || current.imageUrl,
          originalUrl: normalized.url,
          storeName: metadata.storeName || metadata.siteName || current.storeName,
          price: metadata.price ? Number(metadata.price) : current.price,
          currency: metadata.currency ? metadata.currency.trim().toUpperCase() : current.currency
        }));
        setProductMetadataMessage(metadata.error || "Product details filled in. You can edit anything before saving.");
      } catch {
        setProductMetadataMessage("We couldn't pull details from this site. You can still add it manually.");
      } finally {
        setFetchingProductMetadata(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [activeSection, productForm.id, productForm.originalUrl]);

  const search = query.trim().toLowerCase();
  const metrics = overview?.metrics;
  const selectedUser = (overview?.users ?? []).find((user) => user.id === selectedUserId) ?? null;

  const filteredUsers = useMemo(() => {
    return (overview?.users ?? []).filter((user) => {
      const matchesFilter =
        userFilter === "all" ||
        (userFilter === "admins" && user.isAdmin) ||
        (userFilter === "has_gifts" && user.giftCount > 0) ||
        (userFilter === "no_gifts" && user.giftCount === 0);
      return matchesFilter && includesQuery([user.name, user.email, user.profileCount, user.giftCount], search);
    });
  }, [overview?.users, search, userFilter]);

  const filteredProducts = useMemo(() => {
    return (overview?.recommendedProducts ?? []).filter((product) => {
      const matchesFilter =
        productFilter === "all" ||
        (productFilter === "active" && product.active) ||
        (productFilter === "inactive" && !product.active) ||
        (productFilter === "affiliate_missing" && !product.affiliateUrl) ||
        (productFilter === "affiliate_ready" && Boolean(product.affiliateUrl));
      return matchesFilter && includesQuery([product.title, product.storeName, product.category, product.tags, product.affiliateStatus], search);
    });
  }, [overview?.recommendedProducts, productFilter, search]);

  const filteredWishlists = useMemo(() => {
    return (overview?.wishlists ?? []).filter((profile) =>
      includesQuery([profile.displayName, profile.slug, profile.relationship, profile.listVisibility, profile.ownerName, profile.ownerEmail], search)
    );
  }, [overview?.wishlists, search]);

  const filteredGifts = useMemo(() => {
    return (overview?.gifts ?? []).filter((gift) =>
      includesQuery([gift.title, gift.storeName, gift.visibility, gift.affiliateStatus, gift.wishlistTitle, gift.ownerEmail], search)
    );
  }, [overview?.gifts, search]);

  const filteredUnmatched = useMemo(() => {
    return (overview?.unmatchedGifts ?? []).filter((gift) =>
      includesQuery([gift.title, gift.storeName, gift.affiliateStatus], search)
    );
  }, [overview?.unmatchedGifts, search]);

  function updateProduct<K extends keyof RecommendedProduct>(key: K, value: RecommendedProduct[K]) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  function updateAffiliate<K extends keyof AffiliateProgram>(key: K, value: AffiliateProgram[K]) {
    setAffiliateForm((current) => ({ ...current, [key]: value }));
  }

  function editProduct(product: RecommendedProduct) {
    setProductForm(product);
    lastFetchedProductUrl.current = product.originalUrl;
    setProductMetadataMessage("");
    setActiveSection("recommended");
    setMessage("Editing recommended product.");
  }

  function editAffiliate(program: AffiliateProgram) {
    setAffiliateForm(program);
    setActiveSection("affiliate");
    setMessage("Editing affiliate program.");
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = await requestJson<RecommendedProduct>(
        productForm.id ? `/api/admin/recommended-products/${productForm.id}` : "/api/admin/recommended-products",
        {
          method: productForm.id ? "PUT" : "POST",
          body: JSON.stringify(productForm)
        }
      );
      setProductForm(blankProduct);
      setMessage(`${saved.title} saved.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommended product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAffiliate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = await requestJson<AffiliateProgram>(
        affiliateForm.id ? `/api/admin/affiliate-programs/${affiliateForm.id}` : "/api/admin/affiliate-programs",
        {
          method: affiliateForm.id ? "PUT" : "POST",
          body: JSON.stringify(affiliateForm)
        }
      );
      setAffiliateForm(blankAffiliate);
      setMessage(`${saved.name} saved. Amazon URLs can now use tag ${saved.trackingId}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Affiliate program could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("Delete this recommended product?")) return;
    setError("");
    try {
      await requestJson<{ ok: boolean }>(`/api/admin/recommended-products/${id}`, { method: "DELETE" });
      await refresh();
      setMessage("Recommended product deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommended product could not be deleted.");
    }
  }

  async function deleteAffiliate(id: string) {
    if (!window.confirm("Delete this affiliate setup? Existing generated affiliate URLs will not be rewritten.")) return;
    setError("");
    try {
      await requestJson<{ ok: boolean }>(`/api/admin/affiliate-programs/${id}`, { method: "DELETE" });
      await refresh();
      setMessage("Affiliate setup deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Affiliate setup could not be deleted.");
    }
  }

  async function backfillAmazonLinks() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const result = await requestJson<{ totalUpdated: number; giftsUpdated: number; recommendedUpdated: number }>("/api/admin/affiliate-programs/backfill", {
        method: "POST"
      });
      await refresh();
      setMessage(`Affiliate scan complete: ${result.totalUpdated} Amazon ${result.totalUpdated === 1 ? "item" : "items"} updated (${result.giftsUpdated} gifts, ${result.recommendedUpdated} recommended products).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Affiliate scan could not be completed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(userId: string) {
    const adminUser = (overview?.users ?? []).find((user) => user.id === userId);
    if (!adminUser) return;
    if (overview?.currentUserId === userId) {
      setError("You cannot delete your own admin account.");
      return;
    }
    const confirmed = window.confirm(
      `Delete ${adminUser.name}? This deletes the user account, sessions, profiles, wishlists, gift items, reservations, and contribution records. Password hashes are not shown and will be removed with the account.`
    );
    if (!confirmed) return;
    setError("");
    try {
      await requestJson<{ ok: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" });
      setSelectedUserId("");
      await refresh();
      setMessage(`${adminUser.name} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "User could not be deleted.");
    }
  }

  const cards: Array<{ id: AdminSection; label: string; value: string | number; detail: string; icon: React.ReactNode }> = [
    { id: "users", label: "Users", value: metrics?.totalUsers ?? "-", detail: "Search, filter, inspect, delete", icon: <UsersRound size={20} /> },
    { id: "gifts", label: "Gifts", value: metrics?.totalGifts ?? "-", detail: "Saved product ideas", icon: <PackagePlus size={20} /> },
    { id: "wishlists", label: "Wishlists", value: metrics?.totalProfiles ?? "-", detail: "Profiles and list visibility", icon: <ShieldCheck size={20} /> },
    { id: "recommended", label: "Recommended Products", value: metrics?.recommendedProducts ?? "-", detail: "Curated gift discovery", icon: <ExternalLink size={20} /> },
    { id: "affiliate", label: "Affiliate Setup", value: metrics?.affiliatePrograms ?? "-", detail: "Amazon tracking tags only", icon: <Link2 size={20} /> },
    { id: "unmatched", label: "Unmatched Products", value: metrics?.productsMissingAffiliateLinks ?? "-", detail: "Needs affiliate review", icon: <Search size={20} /> },
    { id: "analytics", label: "Analytics", value: metrics?.productsWithAffiliateLinks ?? "-", detail: "Buying and save signals", icon: <BarChart3 size={20} /> }
  ];

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase text-berry">Admin</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Giftly operations</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
          Review users, gift activity, recommendations, and affiliate setup without exposing passwords, tokens, or affiliate account credentials.
        </p>
      </section>

      {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            type="button"
            className={`focus-ring grid gap-3 rounded-[1.5rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft ${
              activeSection === card.id ? "border-berry/35 bg-blush" : "border-ink/10 bg-white"
            }`}
            key={card.id}
            onClick={() => setActiveSection(card.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-cloud text-berry">{card.icon}</span>
              <span className="text-3xl font-black">{card.value}</span>
            </div>
            <div>
              <h2 className="font-black">{card.label}</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-ink/55">{card.detail}</p>
            </div>
          </button>
        ))}
      </section>

      {activeSection ? (
        <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-berry">Section</p>
              <h2 className="text-2xl font-black">{cards.find((card) => card.id === activeSection)?.label}</h2>
            </div>
            <Button type="button" variant="ghost" onClick={() => setActiveSection(null)}>
              <X size={16} />
              Close
            </Button>
          </div>

          {activeSection !== "analytics" ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-ink/35" size={16} />
                <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this section" />
              </div>
              {activeSection === "users" ? (
                <Select value={userFilter} onChange={(event) => setUserFilter(event.target.value as UserFilter)}>
                  <option value="all">All users</option>
                  <option value="admins">Admins</option>
                  <option value="has_gifts">Has gifts</option>
                  <option value="no_gifts">No gifts</option>
                </Select>
              ) : null}
              {activeSection === "recommended" ? (
                <Select value={productFilter} onChange={(event) => setProductFilter(event.target.value as ProductFilter)}>
                  <option value="all">All products</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="affiliate_missing">Missing affiliate</option>
                  <option value="affiliate_ready">Affiliate ready</option>
                </Select>
              ) : null}
            </div>
          ) : null}

          {activeSection === "users" ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
              <div className="grid gap-2">
                {filteredUsers.map((adminUser) => (
                  <button
                    type="button"
                    className="grid gap-1 rounded-2xl bg-cloud p-3 text-left text-sm font-bold sm:grid-cols-[1fr_auto]"
                    key={adminUser.id}
                    onClick={() => setSelectedUserId(adminUser.id)}
                  >
                    <div>
                      <p className="font-black">{adminUser.name} {adminUser.isAdmin ? <span className="text-berry">/ admin</span> : null}</p>
                      <p className="text-ink/55">{adminUser.email}</p>
                    </div>
                    <p className="text-ink/55">{adminUser.profileCount} lists / {adminUser.giftCount} gifts</p>
                  </button>
                ))}
              </div>
              <article className="grid content-start gap-3 rounded-3xl border border-ink/10 bg-white p-4">
                {selectedUser ? (
                  <>
                    <div>
                      <p className="text-xs font-black uppercase text-berry">User detail</p>
                      <h3 className="text-xl font-black">{selectedUser.name}</h3>
                      <p className="text-sm font-bold text-ink/55">{selectedUser.email}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                      <p className="rounded-2xl bg-cloud p-3">{selectedUser.profileCount} lists</p>
                      <p className="rounded-2xl bg-cloud p-3">{selectedUser.giftCount} gifts</p>
                    </div>
                    <p className="rounded-2xl bg-blush p-3 text-xs font-bold leading-5 text-berry">
                      Deleting removes the account, sessions, profiles, gifts, reservations, and contribution placeholders. Passwords and secrets are never shown here.
                    </p>
                    <Button type="button" variant="danger" disabled={overview?.currentUserId === selectedUser.id} onClick={() => deleteUser(selectedUser.id)}>
                      <Trash2 size={14} />
                      {overview?.currentUserId === selectedUser.id ? "Current admin cannot be deleted" : "Delete user"}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-ink/60">Select a user to view support-safe details.</p>
                )}
              </article>
            </div>
          ) : null}

          {activeSection === "wishlists" ? (
            <div className="grid gap-2">
              {filteredWishlists.map((profile) => (
                <div className="grid gap-1 rounded-2xl bg-cloud p-3 text-sm font-bold sm:grid-cols-[1fr_auto]" key={profile.id}>
                  <div>
                    <p className="font-black">{profile.displayName} <span className="text-ink/45">/ {profile.relationship}</span></p>
                    <p className="text-ink/55">/profiles/{profile.slug} / {profile.ownerEmail}</p>
                  </div>
                  <p className="text-ink/55">{profile.giftCount} gifts / {profile.listVisibility}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeSection === "gifts" ? (
            <div className="grid gap-2">
              {filteredGifts.map((gift) => (
                <div className="grid gap-1 rounded-2xl bg-cloud p-3 text-sm font-bold sm:grid-cols-[1fr_auto]" key={gift.id}>
                  <div>
                    <p className="font-black">{gift.title}</p>
                    <p className="text-ink/55">{gift.storeName} / {gift.wishlistTitle} / {gift.ownerEmail}</p>
                  </div>
                  <p className="text-ink/55">{priceLabel(gift)} / {gift.affiliateUrl ? "affiliate ready" : "missing affiliate"}</p>
                </div>
              ))}
            </div>
          ) : null}

          {activeSection === "recommended" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <form onSubmit={saveProduct} className="grid gap-3 rounded-3xl bg-cloud p-3">
                <h3 className="text-xl font-black">{productForm.id ? "Edit recommended product" : "Add recommended product"}</h3>
                <Field label="Product URL">
                  <Input value={productForm.originalUrl} onChange={(event) => updateProduct("originalUrl", event.target.value)} placeholder="https://..." />
                </Field>
                {fetchingProductMetadata ? <p className="text-sm font-bold text-ink/55">Fetching product details...</p> : null}
                {productMetadataMessage ? <p className="text-sm font-bold text-ink/60">{productMetadataMessage}</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Title">
                    <Input required value={productForm.title} onChange={(event) => updateProduct("title", event.target.value)} />
                  </Field>
                  <Field label="Store/source">
                    <Input value={productForm.storeName} onChange={(event) => updateProduct("storeName", event.target.value)} />
                  </Field>
                  <Field label="Price">
                    <Input type="number" step="0.01" value={productForm.price} onChange={(event) => updateProduct("price", Number(event.target.value))} />
                  </Field>
                  <Field label="Currency">
                    <Input value={productForm.currency} onChange={(event) => updateProduct("currency", event.target.value.toUpperCase())} placeholder="USD, CAD..." />
                  </Field>
                  <Field label="Image URL">
                    <Input value={productForm.imageUrl} onChange={(event) => updateProduct("imageUrl", event.target.value)} />
                  </Field>
                  <Field label="Category">
                    <Input value={productForm.category} onChange={(event) => updateProduct("category", event.target.value)} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea value={productForm.description} onChange={(event) => updateProduct("description", event.target.value)} />
                </Field>
                <Field label="Tags">
                  <Input value={productForm.tags} onChange={(event) => updateProduct("tags", event.target.value)} />
                </Field>
                <Field label="Target audience notes">
                  <Textarea value={productForm.targetAudienceNotes} onChange={(event) => updateProduct("targetAudienceNotes", event.target.value)} />
                </Field>
                <div className="grid gap-3 rounded-3xl bg-white p-3 sm:grid-cols-2">
                  <Field label="Affiliate URL">
                    <Input value={productForm.affiliateUrl ?? ""} onChange={(event) => updateProduct("affiliateUrl", event.target.value)} />
                  </Field>
                  <Field label="Affiliate program/source">
                    <Input value={productForm.affiliateProgram ?? ""} onChange={(event) => updateProduct("affiliateProgram", event.target.value)} />
                  </Field>
                  <Field label="Affiliate status">
                    <Select value={productForm.affiliateStatus} onChange={(event) => updateProduct("affiliateStatus", event.target.value as RecommendedAffiliateStatus)}>
                      <option value="none">None</option>
                      <option value="matched">Matched</option>
                      <option value="needs_review">Needs review</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </Field>
                  <Field label="Affiliate notes">
                    <Input value={productForm.affiliateNotes ?? ""} onChange={(event) => updateProduct("affiliateNotes", event.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {(["active", "featured", "hot", "seasonal"] as const).map((key) => (
                    <label className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-black" key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(productForm[key])}
                        onChange={(event) => updateProduct(key, event.target.checked)}
                      />
                      {key}
                    </label>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save product"}</Button>
                  <Button type="button" variant="ghost" onClick={() => setProductForm(blankProduct)}>Clear form</Button>
                </div>
              </form>

              <div className="grid content-start gap-3">
                {filteredProducts.map((product) => (
                  <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm sm:grid-cols-[7rem_1fr]" key={product.id}>
                    <img src={product.imageUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                    <div className="grid gap-2">
                      <div>
                        <p className="text-xs font-black uppercase text-berry">{product.category || "General"}</p>
                        <h3 className="text-lg font-black">{product.title}</h3>
                        <p className="text-xs font-bold text-ink/55">{product.storeName} / {priceLabel(product)} / affiliate: {product.affiliateStatus}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl bg-coral px-3 text-xs font-black text-white hover:bg-berry" href={product.affiliateUrl || product.originalUrl} target="_blank">
                          <ExternalLink size={13} />
                          Buy link
                        </a>
                        <Button type="button" variant="ghost" onClick={() => editProduct(product)}><Edit3 size={14} />Edit</Button>
                        <Button type="button" variant="danger" onClick={() => deleteProduct(product.id)}><Trash2 size={14} />Delete</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeSection === "affiliate" ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <form onSubmit={saveAffiliate} className="grid gap-3 rounded-3xl bg-cloud p-3">
                <h3 className="text-xl font-black">{affiliateForm.id ? "Edit affiliate setup" : "Amazon Associates setup"}</h3>
                <Field label="Affiliate program name">
                  <Input value={affiliateForm.name} onChange={(event) => updateAffiliate("name", event.target.value)} />
                </Field>
                <Field label="Amazon tracking tag">
                  <Input required value={affiliateForm.trackingId} onChange={(event) => updateAffiliate("trackingId", event.target.value)} placeholder="terryfoster0a-20" />
                </Field>
                <Field label="Default region/domain">
                  <Input value={affiliateForm.defaultDomain} onChange={(event) => updateAffiliate("defaultDomain", event.target.value)} placeholder="amazon.com or amazon.ca" />
                </Field>
                <Field label="Notes">
                  <Textarea value={affiliateForm.notes} onChange={(event) => updateAffiliate("notes", event.target.value)} />
                </Field>
                <label className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-black">
                  <input type="checkbox" checked={affiliateForm.active} onChange={(event) => updateAffiliate("active", event.target.checked)} />
                  Active
                </label>
                <p className="rounded-2xl bg-blush p-3 text-xs font-bold leading-5 text-berry">
                  Store only tracking tags and manual affiliate URLs here. Do not store Amazon passwords, account credentials, or dashboard login details.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save affiliate setup"}</Button>
                  <Button type="button" variant="ghost" onClick={() => setAffiliateForm(blankAffiliate)}>Clear form</Button>
                </div>
                <Button type="button" variant="secondary" onClick={backfillAmazonLinks} disabled={saving}>
                  Scan existing Amazon products
                </Button>
              </form>

              <div className="grid content-start gap-3">
                {(overview?.affiliatePrograms ?? []).map((program) => (
                  <article className="grid gap-2 rounded-2xl border border-ink/10 bg-white p-3 shadow-sm" key={program.id}>
                    <div>
                      <p className="text-xs font-black uppercase text-berry">{program.active ? "Active" : "Inactive"}</p>
                      <h3 className="text-lg font-black">{program.name}</h3>
                      <p className="text-sm font-bold text-ink/55">{program.trackingId} / {program.defaultDomain}</p>
                    </div>
                    <p className="text-sm font-semibold leading-6 text-ink/60">{program.notes || "No notes yet."}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" onClick={() => editAffiliate(program)}><Edit3 size={14} />Edit</Button>
                      <Button type="button" variant="danger" onClick={() => deleteAffiliate(program.id)}><Trash2 size={14} />Delete</Button>
                    </div>
                  </article>
                ))}
                {overview?.affiliatePrograms.length === 0 ? <p className="text-sm font-semibold text-ink/60">Add your Amazon tracking tag to start generating Amazon affiliate URLs.</p> : null}
              </div>
            </div>
          ) : null}

          {activeSection === "unmatched" ? (
            <div className="grid gap-2">
              {filteredUnmatched.map((gift) => (
                <div className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65" key={gift.id}>
                  <p className="font-black text-ink">{gift.title}</p>
                  <p>{gift.storeName} / affiliate: {gift.affiliateStatus}</p>
                </div>
              ))}
              {filteredUnmatched.length === 0 ? <p className="text-sm font-semibold text-ink/60">No unmatched products match this search.</p> : null}
            </div>
          ) : null}

          {activeSection === "analytics" ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="grid gap-3 rounded-3xl bg-cloud p-3">
                <h3 className="text-xl font-black">Buying signals</h3>
                {(overview?.mostAddedProducts ?? []).map((item) => (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm font-bold" key={`${item.title}-${item.storeName}`}>
                    <span>{item.title} <span className="text-ink/45">/ {item.storeName}</span></span>
                    <span className="rounded-full bg-cloud px-2 py-1 text-xs font-black">{item.count}</span>
                  </div>
                ))}
                {overview?.mostAddedProducts.length === 0 ? <p className="text-sm font-semibold text-ink/60">Signals will appear as gifts are saved.</p> : null}
              </article>
              <article className="grid content-start gap-3 rounded-3xl bg-cloud p-3">
                <h3 className="text-xl font-black">Affiliate coverage</h3>
                <p className="rounded-2xl bg-white p-3 text-sm font-bold">Affiliate links: {metrics?.productsWithAffiliateLinks ?? 0}</p>
                <p className="rounded-2xl bg-white p-3 text-sm font-bold">Missing links: {metrics?.productsMissingAffiliateLinks ?? 0}</p>
                <p className="rounded-2xl bg-white p-3 text-sm font-bold">Affiliate programs: {metrics?.affiliatePrograms ?? 0}</p>
              </article>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
