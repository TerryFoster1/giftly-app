"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Gift, RefreshCw, Shuffle, UserPlus } from "lucide-react";
import { clientRequestJson } from "@/lib/client-api";
import { useGiftlyStore } from "@/lib/store";
import type { Connection, Profile, SecretSantaEvent, SecretSantaJoinStatus, SecretSantaParticipant } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function participantLabel(participant: SecretSantaParticipant) {
  return participant.displayName || participant.invitedEmail || "Invited guest";
}

function inviteUrl(token: string) {
  if (typeof window === "undefined") return `/secret-santa/invite/${token}`;
  return `${window.location.origin}/secret-santa/invite/${token}`;
}

function connectionName(connection: Connection) {
  return connection.displayName || connection.realName || connection.emailOrPhone || "Bubble person";
}

function profileName(profile: Profile) {
  return `${profile.displayName} (${profile.relationship})`;
}

export function SecretSantaEventClient({ eventId }: { eventId: string }) {
  const { user, connections = [], profiles = [], ready } = useGiftlyStore();
  const [event, setEvent] = useState<SecretSantaEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const isOrganizer = event?.organizerUserId === user?.id;
  const myParticipant = useMemo(
    () => event?.participants.find((participant) => participant.userId === user?.id || participant.invitedEmail === user?.email.toLowerCase()),
    [event?.participants, user?.email, user?.id]
  );
  const acceptedCount = event?.participants.filter((participant) => participant.joinStatus === "accepted").length ?? 0;
  const canDraw = Boolean(isOrganizer && event?.status !== "drawn" && acceptedCount >= 3);
  const managedProfiles = profiles.filter((profile) => !profile.isPrimary);

  async function refresh() {
    const nextEvent = await clientRequestJson<SecretSantaEvent>(`/api/secret-santa/${eventId}`);
    setEvent(nextEvent);
  }

  useEffect(() => {
    refresh()
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Could not load this exchange."))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function runAction(label: string, action: () => Promise<void>) {
    setSaving(label);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "That action could not be completed.");
    } finally {
      setSaving("");
    }
  }

  async function copyInvite(token: string) {
    await navigator.clipboard?.writeText(inviteUrl(token));
    setMessage("Invite link copied.");
  }

  async function addParticipant(event: React.FormEvent) {
    event.preventDefault();
    await runAction("participant", async () => {
      const created = await clientRequestJson<SecretSantaParticipant>(`/api/secret-santa/${eventId}/participants`, {
        method: "POST",
        body: JSON.stringify({ connectionId: connectionId || undefined, profileId: profileId || undefined, invitedEmail, displayName })
      });
      setEvent((current) => (current ? { ...current, participants: [...current.participants, created] } : current));
      setConnectionId("");
      setProfileId("");
      setInvitedEmail("");
      setDisplayName("");
      setMessage("Participant added. Copy their invite link when you are ready.");
    });
  }

  async function respond(status: SecretSantaJoinStatus) {
    if (!myParticipant) return;
    await runAction(status, async () => {
      const updated = await clientRequestJson<SecretSantaParticipant>(`/api/secret-santa/${eventId}/participants/${myParticipant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setEvent((current) =>
        current ? { ...current, participants: current.participants.map((participant) => (participant.id === updated.id ? updated : participant)) } : current
      );
    });
  }

  async function removeParticipant(participantId: string) {
    await runAction(participantId, async () => {
      await clientRequestJson<{ ok: boolean }>(`/api/secret-santa/${eventId}/participants/${participantId}`, { method: "DELETE" });
      setEvent((current) => (current ? { ...current, participants: current.participants.filter((participant) => participant.id !== participantId) } : current));
    });
  }

  async function runDraw() {
    await runAction("draw", async () => {
      const updated = await clientRequestJson<SecretSantaEvent>(`/api/secret-santa/${eventId}/draw`, { method: "POST" });
      setEvent(updated);
      setMessage("Draw complete. Assignments are locked and private.");
    });
  }

  async function resetDraw() {
    if (!window.confirm("Reset this draw? This deletes assignments and private Secret Santa gift actions.")) return;
    await runAction("reset", async () => {
      const updated = await clientRequestJson<SecretSantaEvent>(`/api/secret-santa/${eventId}/draw`, { method: "DELETE" });
      setEvent(updated);
      setMessage("Draw reset. You can adjust participants and run it again.");
    });
  }

  if (loading || !ready) {
    return <main className="mx-auto max-w-6xl px-4 py-8 text-sm font-bold text-ink/60">Loading gift exchange...</main>;
  }

  if (!event) {
    return <main className="mx-auto max-w-6xl px-4 py-8 text-sm font-bold text-red-600">{error || "Gift exchange not found."}</main>;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
        <div className="grid gap-5 md:grid-cols-[1.4fr_0.6fr] md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-coral">Private gift exchange</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{event.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              <span className="rounded-full bg-blush px-3 py-1 text-ink">{formatDate(event.occasionDate)}</span>
              <span className="rounded-full bg-mint/40 px-3 py-1 text-ink">{acceptedCount} accepted</span>
              <span className="rounded-full bg-white px-3 py-1 text-ink ring-1 ring-ink/10">{event.status}</span>
            </div>
            {event.rulesMessage ? <p className="mt-4 text-sm font-semibold text-ink/65">{event.rulesMessage}</p> : null}
            {event.shippingNotes ? <p className="mt-2 text-sm font-semibold text-ink/55">{event.shippingNotes}</p> : null}
          </div>
          <div className="grid gap-3">
            {event.status === "drawn" && myParticipant?.joinStatus === "accepted" ? (
              <Link href={`/secret-santa/${event.id}/assignment`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-3 text-sm font-black text-white shadow-soft">
                <Gift size={18} /> View my assignment
              </Link>
            ) : null}
            {isOrganizer ? (
              <>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white shadow-soft disabled:opacity-50" disabled={!canDraw || Boolean(saving)} onClick={runDraw}>
                  <Shuffle size={18} /> {saving === "draw" ? "Running..." : "Run draw"}
                </button>
                {event.status === "drawn" ? (
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-white px-5 py-3 text-sm font-black text-ink" onClick={resetDraw} disabled={Boolean(saving)}>
                    <RefreshCw size={18} /> Reset draw
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
        {acceptedCount < 3 && event.status !== "drawn" ? (
          <p className="mt-5 rounded-2xl bg-blush p-4 text-sm font-bold text-ink">At least 3 accepted participants are needed before Giftly can run the draw.</p>
        ) : null}
        {message ? <p className="mt-4 rounded-2xl bg-mint/40 p-3 text-sm font-bold text-ink">{message}</p> : null}
        {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-600">{error}</p> : null}
      </section>

      {!isOrganizer && myParticipant?.joinStatus === "invited" ? (
        <section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-ink">Are you in?</h2>
          <p className="mt-2 text-sm font-semibold text-ink/60">Confirm before the organizer runs the draw.</p>
          <div className="mt-4 flex gap-3">
            <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white" onClick={() => respond("accepted")}>Accept</button>
            <button className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-black text-ink" onClick={() => respond("declined")}>Decline</button>
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {isOrganizer && event.status !== "drawn" ? (
          <form className="rounded-[1.5rem] bg-white p-5 shadow-soft" onSubmit={addParticipant}>
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-coral" />
              <h2 className="text-lg font-black text-ink">Add participants</h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink/60">Choose from your Bubble, one of your managed wishlists, or invite by email.</p>
            <div className="mt-4 grid gap-3">
              <select className="rounded-2xl border border-ink/10 px-4 py-3 text-sm font-bold" value={connectionId} onChange={(event) => setConnectionId(event.target.value)}>
                <option value="">Select from Bubble</option>
                {connections.map((connection) => <option key={connection.id} value={connection.id}>{connectionName(connection)}</option>)}
              </select>
              <select className="rounded-2xl border border-ink/10 px-4 py-3 text-sm font-bold" value={profileId} onChange={(event) => setProfileId(event.target.value)}>
                <option value="">Or select a managed wishlist</option>
                {managedProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profileName(profile)}</option>)}
              </select>
              <input className="rounded-2xl border border-ink/10 px-4 py-3 text-sm font-bold" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" />
              <input className="rounded-2xl border border-ink/10 px-4 py-3 text-sm font-bold" value={invitedEmail} onChange={(event) => setInvitedEmail(event.target.value)} placeholder="Email for invite link" />
              <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-black text-white disabled:opacity-60" disabled={saving === "participant"}>
                {saving === "participant" ? "Adding..." : "Add participant"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="rounded-[1.5rem] bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-ink">Participants</h2>
          <div className="mt-4 grid gap-3">
            {event.participants.map((participant) => (
              <div key={participant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 p-4">
                <div>
                  <p className="font-black text-ink">{participantLabel(participant)}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-ink/45">{participant.joinStatus}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOrganizer && event.status !== "drawn" ? (
                    <>
                      <button className="inline-flex items-center gap-1 rounded-full bg-blush px-3 py-2 text-xs font-black text-ink" type="button" onClick={() => copyInvite(participant.inviteToken)}>
                        <Copy size={14} /> Invite
                      </button>
                      {participant.userId !== user?.id ? (
                        <button className="rounded-full border border-ink/10 px-3 py-2 text-xs font-black text-ink" type="button" onClick={() => removeParticipant(participant.id)}>
                          Remove
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
