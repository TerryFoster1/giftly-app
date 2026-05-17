"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Gift, Plus } from "lucide-react";
import { clientRequestJson } from "@/lib/client-api";
import { useGiftlyStore } from "@/lib/store";
import type { SecretSantaEvent } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function SecretSantaListClient() {
  const { user } = useGiftlyStore();
  const [events, setEvents] = useState<SecretSantaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    clientRequestJson<SecretSantaEvent[]>("/api/secret-santa")
      .then(setEvents)
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not load gift exchanges."))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const active = events.filter((event) => event.status !== "archived");
    const archived = events.filter((event) => event.status === "archived");
    return { active, archived };
  }, [events]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-coral">Gift exchange</p>
            <h1 className="mt-2 text-3xl font-black text-ink md:text-5xl">Secret Santa, minus the spoilers.</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-ink/65 md:text-base">
              Create a private exchange, invite your people, run the draw, and let each participant see only who they are buying for.
            </p>
          </div>
          <Link
            href="/secret-santa/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-black text-white shadow-soft"
          >
            <Plus size={18} /> Create exchange
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-ink">My gift exchanges</h2>
          <Link href="/secret-santa/new" className="text-sm font-black text-coral">
            New
          </Link>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-red-600">{error}</p> : null}
        {loading ? <p className="mt-4 text-sm font-bold text-ink/60">Loading exchanges...</p> : null}
        {!loading && !grouped.active.length ? (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-ink/15 bg-white/70 p-6 text-center">
            <Gift className="mx-auto text-coral" />
            <h3 className="mt-3 text-lg font-black text-ink">Start a private gift exchange</h3>
            <p className="mt-2 text-sm font-semibold text-ink/60">Add at least three accepted participants, then Giftly will lock in a private draw.</p>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grouped.active.map((event) => {
            const accepted = event.participants.filter((participant) => participant.joinStatus === "accepted").length;
            const isOrganizer = event.organizerUserId === user?.id;
            return (
              <Link key={event.id} href={`/secret-santa/${event.id}`} className="rounded-[1.5rem] bg-white p-5 shadow-soft transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/40">{event.status}</p>
                    <h3 className="mt-2 text-lg font-black text-ink">{event.title}</h3>
                  </div>
                  <ArrowRight size={18} className="text-coral" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink/60">{formatDate(event.occasionDate)}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-blush px-3 py-1 text-ink">{accepted} accepted</span>
                  <span className="rounded-full bg-mint/40 px-3 py-1 text-ink">{isOrganizer ? "Organizer" : "Participant"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
