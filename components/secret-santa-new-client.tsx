"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientRequestJson } from "@/lib/client-api";
import type { SecretSantaEvent } from "@/lib/types";

export function SecretSantaNewClient() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");
  const [rulesMessage, setRulesMessage] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await clientRequestJson<SecretSantaEvent>("/api/secret-santa", {
        method: "POST",
        body: JSON.stringify({ title, occasionDate, spendingLimit, rulesMessage, shippingNotes })
      });
      router.push(`/secret-santa/${created.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not create the exchange.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-coral">New exchange</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Create a Secret Santa</h1>
        <p className="mt-3 text-sm font-semibold text-ink/60">Set the basics now. You can invite people and run the draw on the next screen.</p>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-black text-ink">
            Event title
            <input className="rounded-2xl border border-ink/10 px-4 py-3 font-semibold outline-none focus:border-coral" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Family Secret Santa" required />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-ink">
              Occasion date
              <input className="rounded-2xl border border-ink/10 px-4 py-3 font-semibold outline-none focus:border-coral" type="date" value={occasionDate} onChange={(event) => setOccasionDate(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-black text-ink">
              Spending limit
              <input className="rounded-2xl border border-ink/10 px-4 py-3 font-semibold outline-none focus:border-coral" inputMode="decimal" value={spendingLimit} onChange={(event) => setSpendingLimit(event.target.value)} placeholder="50" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-black text-ink">
            Rules or message
            <textarea className="min-h-28 rounded-2xl border border-ink/10 px-4 py-3 font-semibold outline-none focus:border-coral" value={rulesMessage} onChange={(event) => setRulesMessage(event.target.value)} placeholder="Keep it fun, thoughtful, and surprise-safe." />
          </label>
          <label className="grid gap-2 text-sm font-black text-ink">
            Shipping or meetup notes
            <textarea className="min-h-24 rounded-2xl border border-ink/10 px-4 py-3 font-semibold outline-none focus:border-coral" value={shippingNotes} onChange={(event) => setShippingNotes(event.target.value)} placeholder="Ship by Dec 15 or bring wrapped gifts to dinner." />
          </label>
          {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
          <button className="rounded-2xl bg-coral px-5 py-3 text-sm font-black text-white shadow-soft disabled:opacity-60" disabled={saving}>
            {saving ? "Creating..." : "Create exchange"}
          </button>
        </form>
      </section>
    </main>
  );
}
