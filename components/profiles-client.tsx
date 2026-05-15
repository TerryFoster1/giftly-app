"use client";

import Link from "next/link";
import { Plus, QrCode, RotateCcw, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { formatEventDate } from "@/lib/events";
import type { GroupLabel } from "@/lib/types";
import { publicProfilePath, publicProfileUrl } from "@/lib/url";
import { Button, Field, Input, Select, Textarea } from "./ui";
import { QrCard } from "./qr-card";
import { InviteModal } from "./invite-modal";

export function ProfilesClient() {
  const { user, profiles, connections = [], actionError, actions, ready } = useGiftlyStore();
  const [showForm, setShowForm] = useState(false);
  const [shareSlug, setShareSlug] = useState("");
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [vanityDrafts, setVanityDrafts] = useState<Record<string, string>>({});
  const [eventDrafts, setEventDrafts] = useState<Record<string, { birthday: string; anniversary: string }>>({});
  const [vanityMessage, setVanityMessage] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    relationship: "",
    bio: "",
    photoUrl: "",
    birthday: "",
    anniversary: "",
    hasAccount: "no",
    emailOrPhone: "",
    groupLabel: "FAMILY" as GroupLabel,
    customGroupLabel: ""
  });

  if (!ready) return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading profiles…</main>;

  async function createProfile(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (form.hasAccount === "yes") {
        await actions.createConnection({
          emailOrPhone: form.emailOrPhone,
          groupLabel: form.groupLabel,
          customGroupLabel: form.customGroupLabel
        });
      } else {
        await actions.createProfile({
          displayName: form.displayName,
          relationship: form.relationship,
          bio: form.bio,
          photoUrl: form.photoUrl,
          birthday: form.birthday,
          anniversary: form.anniversary,
          groupLabel: form.groupLabel,
          customGroupLabel: form.customGroupLabel
        });
      }
      setForm({ displayName: "", relationship: "", bio: "", photoUrl: "", birthday: "", anniversary: "", hasAccount: "no", emailOrPhone: "", groupLabel: "FAMILY", customGroupLabel: "" });
      setShowForm(false);
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function deleteProfile(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? This will also delete that profile's gift items, reservations, and contribution records.`)) return;
    try {
      await actions.deleteProfile(id);
      if (profiles.find((profile) => profile.id === id)?.slug === shareSlug) setShareSlug("");
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function resetMyData() {
    try {
      await actions.resetMyGiftlyData();
      setShareSlug("");
      setResetConfirmOpen(false);
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function saveVanityUrl(profileId: string, currentSlug: string) {
    setVanityMessage("");
    try {
      const updated = await actions.updateVanityUrl(profileId, vanityDrafts[profileId] ?? currentSlug);
      setVanityDrafts((current) => ({ ...current, [profileId]: updated.slug }));
      setVanityMessage("Vanity URL saved.");
    } catch {
      setVanityMessage("That vanity URL could not be saved.");
    }
  }

  async function saveProfileEvents(profileId: string, profileBirthday?: string, profileAnniversary?: string) {
    setEventMessage("");
    const draft = eventDrafts[profileId] ?? {
      birthday: profileBirthday ? profileBirthday.slice(0, 10) : "",
      anniversary: profileAnniversary ? profileAnniversary.slice(0, 10) : ""
    };
    try {
      await actions.updateProfileEvents(profileId, draft);
      setEventMessage("Profile dates saved.");
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function saveInvite(input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string }) {
    await actions.createConnection(input);
    await actions.refresh();
  }

  const groupOptions: GroupLabel[] = ["FAMILY", "FRIENDS", "PARTNER", "GUESTS", "CUSTOM"];
  const existingGroupNames = Array.from(
    new Set(
      connections
        .map((connection) =>
          connection.customGroupLabel ||
          connection.groupLabel
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        )
        .filter(Boolean)
    )
  );

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-4">
        {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}
        <div className="flex flex-col gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">Family profiles</p>
            <h1 className="text-3xl font-black">Managed Wishlists</h1>
          </div>
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <Plus size={17} />
            Create Profile
          </Button>
        </div>
        <section className="rounded-[2rem] border border-berry/20 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black">Reset My Giftly Data</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                This is for local testing when you want a clean account without changing your login.
              </p>
            </div>
            <Button type="button" variant="danger" onClick={() => setResetConfirmOpen(true)}>
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>
          {resetConfirmOpen ? (
            <div className="mt-4 rounded-2xl bg-blush p-4">
              <p className="text-sm font-bold leading-6 text-berry">
                This will delete all your profiles, gift items, reservations, and contribution records. Your login account will remain.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="ghost" onClick={() => setResetConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="danger" onClick={resetMyData}>
                  Confirm Reset
                </Button>
              </div>
            </div>
          ) : null}
        </section>
        {showForm ? (
          <form onSubmit={createProfile} className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <Field label="Does this person already have a Giftly account?">
              <Select value={form.hasAccount} onChange={(event) => setForm({ ...form, hasAccount: event.target.value })}>
                <option value="no">No, create a managed wishlist for them</option>
                <option value="yes">Yes, connect existing account</option>
              </Select>
            </Field>
            {form.hasAccount === "yes" ? (
              <div className="grid gap-3 rounded-3xl bg-cloud p-4">
                <Field label="Email or mobile">
                  <Input required value={form.emailOrPhone} onChange={(event) => setForm({ ...form, emailOrPhone: event.target.value })} />
                </Field>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button type="button" variant="ghost">Send Invite</Button>
                  <Button type="button" variant="ghost">Connection Code</Button>
                  <Button type="button" variant="ghost">
                    <QrCode size={16} />
                    Scan QR
                  </Button>
                </div>
                <p className="text-xs font-bold leading-5 text-ink/55">
                  For MVP, saving this creates a pending connection request. Live sending, connection codes, and QR scanning come later.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Display name">
                  <Input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
                </Field>
                <Field label="Relationship">
                  <Input value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} />
                </Field>
                <Field label="Photo URL">
                  <Input value={form.photoUrl} onChange={(event) => setForm({ ...form, photoUrl: event.target.value })} />
                </Field>
                <Field label="Birthday">
                  <Input type="date" value={form.birthday} onChange={(event) => setForm({ ...form, birthday: event.target.value })} />
                </Field>
                <Field label="Anniversary">
                  <Input type="date" value={form.anniversary} onChange={(event) => setForm({ ...form, anniversary: event.target.value })} />
                </Field>
                <Field label="Group">
                  <Select value={form.groupLabel} onChange={(event) => setForm({ ...form, groupLabel: event.target.value as GroupLabel })}>
                    {groupOptions.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            {form.hasAccount === "yes" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Group">
                  <Select value={form.groupLabel} onChange={(event) => setForm({ ...form, groupLabel: event.target.value as GroupLabel })}>
                    {groupOptions.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </Select>
                </Field>
                {form.groupLabel === "CUSTOM" ? (
                  <Field label="Custom group">
                    <Input value={form.customGroupLabel} onChange={(event) => setForm({ ...form, customGroupLabel: event.target.value })} />
                  </Field>
                ) : null}
              </div>
            ) : form.groupLabel === "CUSTOM" ? (
              <Field label="Custom group">
                <Input value={form.customGroupLabel} onChange={(event) => setForm({ ...form, customGroupLabel: event.target.value })} />
              </Field>
            ) : null}
            {form.hasAccount === "no" ? (
              <>
                <Field label="Bio / notes">
                  <Textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
                </Field>
                <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/55">
                  Giftly will generate the public link automatically. This can start as a managed wishlist, then later be invited, claimed, or transferred when the person joins.
                </p>
              </>
            ) : null}
            <Button type="submit">{form.hasAccount === "yes" ? "Create Pending Connection" : "Save Profile"}</Button>
          </form>
        ) : null}
        {connections.length ? (
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black">Connections</h2>
            <div className="mt-3 grid gap-2">
              {connections.map((connection) => (
                <div className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65" key={connection.id}>
                  {connection.emailOrPhone ?? "Managed profile"} · {connection.status} · {connection.groupLabel}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm" key={profile.id}>
              <div className="flex gap-3">
                <img src={profile.photoUrl || "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop"} alt="" className="h-16 w-16 rounded-3xl object-cover" />
                <div>
                  <p className="text-xs font-black uppercase text-berry">{profile.relationship}</p>
                  <h2 className="text-xl font-black">{profile.displayName}</h2>
                  <p className="text-sm font-bold text-ink/50">/u/{profile.slug}</p>
                </div>
              </div>
              {profile.birthday ? (
                <p className="mt-3 inline-flex rounded-full bg-blush px-3 py-1 text-xs font-black text-berry">
                  🎂 {formatEventDate(profile.birthday)}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 rounded-2xl bg-cloud p-3 sm:grid-cols-2">
                <Field label="Birthday">
                  <Input
                    type="date"
                    value={(eventDrafts[profile.id]?.birthday ?? profile.birthday?.slice(0, 10)) || ""}
                    onChange={(event) =>
                      setEventDrafts({
                        ...eventDrafts,
                        [profile.id]: {
                          birthday: event.target.value,
                          anniversary: (eventDrafts[profile.id]?.anniversary ?? profile.anniversary?.slice(0, 10)) || ""
                        }
                      })
                    }
                  />
                </Field>
                <Field label="Anniversary">
                  <Input
                    type="date"
                    value={(eventDrafts[profile.id]?.anniversary ?? profile.anniversary?.slice(0, 10)) || ""}
                    onChange={(event) =>
                      setEventDrafts({
                        ...eventDrafts,
                        [profile.id]: {
                          birthday: (eventDrafts[profile.id]?.birthday ?? profile.birthday?.slice(0, 10)) || "",
                          anniversary: event.target.value
                        }
                      })
                    }
                  />
                </Field>
                <Button type="button" variant="ghost" className="sm:col-span-2" onClick={() => saveProfileEvents(profile.id, profile.birthday, profile.anniversary)}>
                  Save Dates
                </Button>
                {eventMessage ? <p className="text-xs font-bold text-spruce sm:col-span-2">{eventMessage}</p> : null}
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-ink/65">{profile.bio}</p>
              {profile.isPrimary && !profile.isManagedProfile && profile.linkedUserId === user?.id ? (
                <div className="mt-4 rounded-2xl bg-cloud p-3">
                  <Field label="Vanity URL">
                    <Input
                      value={vanityDrafts[profile.id] ?? profile.slug}
                      onChange={(event) => setVanityDrafts({ ...vanityDrafts, [profile.id]: event.target.value })}
                    />
                  </Field>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <p className="text-xs font-bold text-ink/55">/u/{vanityDrafts[profile.id] ?? profile.slug}</p>
                    <Button type="button" variant="ghost" onClick={() => saveVanityUrl(profile.id, profile.slug)}>Save Vanity URL</Button>
                  </div>
                  {vanityMessage ? <p className="mt-2 text-xs font-bold text-spruce">{vanityMessage}</p> : null}
                </div>
              ) : profile.isManagedProfile ? (
                <p className="mt-4 rounded-2xl bg-cloud p-3 text-xs font-bold text-ink/55">
                  This is a managed wishlist. If this person joins Giftly later, they can connect to this profile and ownership can be transferred after a safe claim flow.
                </p>
              ) : null}
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl bg-coral px-3 text-sm font-black text-white hover:bg-berry" href={`/profiles/${profile.slug}`}>
                  Gifts
                </Link>
                <Link className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl bg-mint px-3 text-sm font-black text-spruce hover:bg-spruce hover:text-white" href={publicProfilePath(profile.slug)}>
                  Public
                </Link>
                <Button type="button" variant="ghost" onClick={() => setShareSlug(profile.slug)}>
                  <Share2 size={16} />
                  Share
                </Button>
                <Button type="button" variant="danger" onClick={() => deleteProfile(profile.id, profile.displayName)}>
                  <Trash2 size={16} />
                  Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {shareSlug ? (
          <QrCard url={publicProfileUrl(shareSlug)} />
        ) : (
          <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-xl font-black">QR sharing</h2>
            <p className="mt-2 font-semibold leading-7 text-ink/65">
              Choose Share on any profile to generate a QR code and copyable public wishlist link.
            </p>
          </div>
        )}
      </aside>
      <InviteModal
        open={Boolean(shareSlug)}
        title="Share this wishlist"
        profileUrl={shareSlug ? publicProfileUrl(shareSlug) : ""}
        existingGroups={existingGroupNames}
        onClose={() => setShareSlug("")}
        onInvite={saveInvite}
      />
    </main>
  );
}
