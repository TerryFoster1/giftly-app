"use client";

import { BarChart3, Edit3, ExternalLink, Link2, PackagePlus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AdminOverview, RecommendedAffiliateStatus, RecommendedProduct } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "./ui";

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

function priceLabel(product: RecommendedProduct) {
  if (!product.price) return "Price not set";
  return `${product.currency ? `${product.currency} ` : ""}$${product.price.toFixed(2)}`;
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
  const [form, setForm] = useState<RecommendedProduct>(blankProduct);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

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

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return overview?.users ?? [];
    return (overview?.users ?? []).filter((user) =>
      [user.name, user.email].some((value) => value.toLowerCase().includes(query))
    );
  }, [overview?.users, userSearch]);

  function updateForm<K extends keyof RecommendedProduct>(key: K, value: RecommendedProduct[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function editProduct(product: RecommendedProduct) {
    setForm(product);
    setMessage("Editing recommended product.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = await requestJson<RecommendedProduct>(
        form.id ? `/api/admin/recommended-products/${form.id}` : "/api/admin/recommended-products",
        {
          method: form.id ? "PUT" : "POST",
          body: JSON.stringify(form)
        }
      );
      setForm(blankProduct);
      setMessage(`${saved.title} saved.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recommended product could not be saved.");
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

  const metrics = overview?.metrics;

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase text-berry">Admin</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Gift discovery operations</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
          Manage curated recommendations, affiliate review work, and safe support visibility without storing affiliate credentials.
        </p>
      </section>

      {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{error}</p> : null}

      {metrics ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Total users", metrics.totalUsers],
            ["Total gifts", metrics.totalGifts],
            ["Wishlists/profiles", metrics.totalProfiles],
            ["Recommended products", metrics.recommendedProducts],
            ["Affiliate links", metrics.productsWithAffiliateLinks],
            ["Missing affiliate links", metrics.productsMissingAffiliateLinks]
          ].map(([label, value]) => (
            <article className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" key={label}>
              <p className="text-xs font-black uppercase text-berry">{label}</p>
              <p className="mt-2 text-3xl font-black">{value}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={saveProduct} className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} className="text-berry" />
            <h2 className="text-xl font-black">{form.id ? "Edit recommended product" : "Add recommended product"}</h2>
          </div>
          <Field label="Product URL">
            <Input value={form.originalUrl} onChange={(event) => updateForm("originalUrl", event.target.value)} placeholder="https://..." />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input required value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
            </Field>
            <Field label="Store/source">
              <Input value={form.storeName} onChange={(event) => updateForm("storeName", event.target.value)} />
            </Field>
            <Field label="Price">
              <Input type="number" step="0.01" value={form.price} onChange={(event) => updateForm("price", Number(event.target.value))} />
            </Field>
            <Field label="Currency">
              <Input value={form.currency} onChange={(event) => updateForm("currency", event.target.value.toUpperCase())} placeholder="USD, CAD..." />
            </Field>
            <Field label="Image URL">
              <Input value={form.imageUrl} onChange={(event) => updateForm("imageUrl", event.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={(event) => updateForm("category", event.target.value)} placeholder="Birthday, kids, wedding..." />
            </Field>
          </div>
          <Field label="Description">
            <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </Field>
          <Field label="Tags">
            <Input value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} placeholder="cozy, kids, under-50" />
          </Field>
          <Field label="Target audience notes">
            <Textarea value={form.targetAudienceNotes} onChange={(event) => updateForm("targetAudienceNotes", event.target.value)} />
          </Field>
          <div className="grid gap-3 rounded-3xl bg-cloud p-3 sm:grid-cols-2">
            <Field label="Affiliate URL">
              <Input value={form.affiliateUrl ?? ""} onChange={(event) => updateForm("affiliateUrl", event.target.value)} />
            </Field>
            <Field label="Affiliate program/source">
              <Input value={form.affiliateProgram ?? ""} onChange={(event) => updateForm("affiliateProgram", event.target.value)} />
            </Field>
            <Field label="Affiliate status">
              <Select value={form.affiliateStatus} onChange={(event) => updateForm("affiliateStatus", event.target.value as RecommendedAffiliateStatus)}>
                <option value="none">None</option>
                <option value="matched">Matched</option>
                <option value="needs_review">Needs review</option>
                <option value="manual">Manual</option>
              </Select>
            </Field>
            <Field label="Affiliate notes">
              <Input value={form.affiliateNotes ?? ""} onChange={(event) => updateForm("affiliateNotes", event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ["active", "Active"],
              ["featured", "Featured"],
              ["hot", "Hot"],
              ["seasonal", "Seasonal"]
            ].map(([key, label]) => (
              <label className="flex items-center gap-2 rounded-2xl bg-cloud p-3 text-sm font-black" key={key}>
                <input
                  type="checkbox"
                  checked={Boolean(form[key as keyof RecommendedProduct])}
                  onChange={(event) => updateForm(key as keyof RecommendedProduct, event.target.checked as never)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save product"}</Button>
            <Button type="button" variant="ghost" onClick={() => setForm(blankProduct)}>Clear form</Button>
          </div>
          <p className="rounded-2xl bg-blush p-3 text-xs font-bold leading-5 text-berry">
            Do not store affiliate account passwords or login credentials here. Future API keys belong in environment variables or encrypted settings.
          </p>
        </form>

        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-berry" />
            <h2 className="text-xl font-black">Recommended products</h2>
          </div>
          {(overview?.recommendedProducts ?? []).map((product) => (
            <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-3 shadow-sm sm:grid-cols-[7rem_1fr]" key={product.id}>
              <img src={product.imageUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
              <div className="grid gap-2">
                <div>
                  <p className="text-xs font-black uppercase text-berry">{product.category || "General"}</p>
                  <h3 className="text-lg font-black">{product.title}</h3>
                  <p className="text-xs font-bold text-ink/55">{product.storeName} / {priceLabel(product)}</p>
                </div>
                <p className="text-sm font-semibold leading-6 text-ink/60">{product.description}</p>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  {product.active ? <span className="rounded-full bg-mint px-2 py-1 text-spruce">active</span> : <span className="rounded-full bg-cloud px-2 py-1">inactive</span>}
                  {product.featured ? <span className="rounded-full bg-blush px-2 py-1 text-berry">featured</span> : null}
                  {product.hot ? <span className="rounded-full bg-honey/40 px-2 py-1">hot</span> : null}
                  {product.seasonal ? <span className="rounded-full bg-cloud px-2 py-1">seasonal</span> : null}
                  <span className="rounded-full bg-cloud px-2 py-1">affiliate: {product.affiliateStatus}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className="focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-2xl bg-coral px-3 text-xs font-black text-white hover:bg-berry" href={product.affiliateUrl || product.originalUrl} target="_blank">
                    <ExternalLink size={13} />
                    Buy link
                  </a>
                  <Button type="button" variant="ghost" onClick={() => editProduct(product)}>
                    <Edit3 size={14} />
                    Edit
                  </Button>
                  <Button type="button" variant="danger" onClick={() => deleteProduct(product.id)}>
                    <Trash2 size={14} />
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-berry" />
            <h2 className="text-xl font-black">Unmatched products queue</h2>
          </div>
          {(overview?.unmatchedGifts ?? []).map((gift) => (
            <div className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65" key={gift.id}>
              <p className="font-black text-ink">{gift.title}</p>
              <p>{gift.storeName} / affiliate: {gift.affiliateStatus}</p>
            </div>
          ))}
          {overview?.unmatchedGifts.length === 0 ? <p className="text-sm font-semibold text-ink/60">No unmatched gifts right now.</p> : null}
        </article>

        <article className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-berry" />
            <h2 className="text-xl font-black">Buying signals</h2>
          </div>
          {(overview?.mostAddedProducts ?? []).map((item) => (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-cloud p-3 text-sm font-bold" key={`${item.title}-${item.storeName}`}>
              <span>{item.title} <span className="text-ink/45">/ {item.storeName}</span></span>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-black">{item.count}</span>
            </div>
          ))}
          {overview?.mostAddedProducts.length === 0 ? <p className="text-sm font-semibold text-ink/60">Signals will appear as gifts are saved.</p> : null}
        </article>
      </section>

      <section className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">Support foundation</p>
            <h2 className="text-xl font-black">Safe user lookup</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-ink/35" size={16} />
            <Input className="pl-9" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" />
          </div>
        </div>
        <div className="grid gap-2">
          {filteredUsers.map((adminUser) => (
            <div className="grid gap-1 rounded-2xl bg-cloud p-3 text-sm font-bold sm:grid-cols-[1fr_auto]" key={adminUser.id}>
              <div>
                <p className="font-black">{adminUser.name} {adminUser.isAdmin ? <span className="text-berry">/ admin</span> : null}</p>
                <p className="text-ink/55">{adminUser.email}</p>
              </div>
              <p className="text-ink/55">{adminUser.profileCount} profiles / {adminUser.giftCount} gifts</p>
            </div>
          ))}
        </div>
        <p className="text-xs font-bold leading-5 text-ink/50">
          Passwords, sessions, tokens, and secrets are intentionally not shown here. Edit powers stay minimal in this phase.
        </p>
      </section>
    </main>
  );
}
