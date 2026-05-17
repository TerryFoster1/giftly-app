"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clientRequestJson } from "@/lib/client-api";
import type { SecretSantaEvent, SecretSantaParticipant } from "@/lib/types";

type InvitePayload = {
  event: SecretSantaEvent;
  participant: SecretSantaParticipant;
};

export function SecretSantaInviteClient({ token }: { token: string }) {
  const [invite, setInvite] = useState<InvitePayload | null>(null);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    clientRequestJson<InvitePayload>(`/api/secret-santa/invite/${token}`).then(setInvite).catch((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "Could not load this invite.");
    });
  }, [token]);

  async function respond(status: "accepted" | "declined") {
    setSaving(status);
    setError("");
    try {
      await clientRequestJson(`/api/secret-santa/invite/${token}`, {
        method: "POST",
        body: JSON.stringify({ status })
      });
      if (invite) window.location.href = `/secret-santa/${invite.event.id}`;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not respond to this invite.");
    } finally {
      setSaving("");
    }
  }

  if (!invite && !error) {
    return <main className="mx-auto max-w-3xl px-4 py-8 text-sm font-bold text-ink/60">Loading invite...</main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <section className="rounded-[2rem] bg-white p-6 text-center shadow-soft md:p-8">
        {invite ? (
          <>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-coral">Gift exchange invite</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{invite.event.title}</h1>
            <p className="mt-3 text-sm font-semibold text-ink/60">You were invited as {invite.participant.displayName}. Confirm if you are participating before the draw.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white disabled:opacity-60" onClick={() => respond("accepted")} disabled={Boolean(saving)}>
                {saving === "accepted" ? "Accepting..." : "Accept invite"}
              </button>
              <button className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-black text-ink disabled:opacity-60" onClick={() => respond("declined")} disabled={Boolean(saving)}>
                {saving === "declined" ? "Declining..." : "Decline"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-ink">Invite unavailable</h1>
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
            <Link className="mt-5 inline-flex rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white" href="/secret-santa">
              Back to gift exchanges
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
