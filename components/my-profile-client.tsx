"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { publicProfileUrl } from "@/lib/url";
import { Avatar } from "./avatar";
import { Button, Field, Input } from "./ui";
import { QrCard } from "./qr-card";

export function MyProfileClient() {
  const { user, profiles, ready, actionError, actions } = useGiftlyStore();
  const primaryProfile = profiles.find((profile) => profile.isPrimary && profile.linkedUserId === user?.id) ?? profiles.find((profile) => profile.isPrimary);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    birthday: "",
    anniversary: "",
    photoUrl: "",
    slug: ""
  });

  if (!ready) return <main className="mx-auto max-w-4xl px-4 py-10 font-bold">Loading your profile...</main>;
  if (!user || !primaryProfile) return <main className="mx-auto max-w-4xl px-4 py-10 font-bold">Profile unavailable.</main>;

  const profile = primaryProfile;
  const name = draft.name || profile.displayName || user.name;
  const slug = draft.slug || profile.slug;
  const birthday = draft.birthday || profile.birthday?.slice(0, 10) || "";
  const anniversary = draft.anniversary || profile.anniversary?.slice(0, 10) || "";
  const photoUrl = draft.photoUrl || profile.photoUrl || "";
  const shareUrl = publicProfileUrl(slug);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const updated = await actions.updateMyProfile(profile.id, {
        name,
        birthday,
        anniversary,
        photoUrl,
        slug
      });
      setDraft({
        name: updated.displayName,
        birthday: updated.birthday?.slice(0, 10) || "",
        anniversary: updated.anniversary?.slice(0, 10) || "",
        photoUrl: updated.photoUrl || "",
        slug: updated.slug
      });
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profile could not be saved.");
    }
  }

  async function copyShareLink() {
    await navigator.clipboard?.writeText(shareUrl);
    setMessage("Giftly link copied.");
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6">
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={name} photoUrl={photoUrl} className="h-16 w-16" />
            <div>
              <p className="text-sm font-black uppercase text-berry">My Profile</p>
              <h1 className="text-3xl font-black">{name}</h1>
              <p className="text-sm font-semibold text-ink/55">{user.email}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={copyShareLink}>
            <Copy size={16} />
            Copy Giftly Link
          </Button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={saveProfile} className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black">Profile details</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              These are your own account and public Giftly profile settings. Your Bubble lives separately.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input value={name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <Input readOnly value={user.email} />
            </Field>
            <Field label="Birthday">
              <Input type="date" value={birthday} onChange={(event) => setDraft({ ...draft, birthday: event.target.value })} />
            </Field>
            <Field label="Anniversary">
              <Input type="date" value={anniversary} onChange={(event) => setDraft({ ...draft, anniversary: event.target.value })} />
            </Field>
            <Field label="Photo URL">
              <Input value={photoUrl} onChange={(event) => setDraft({ ...draft, photoUrl: event.target.value })} placeholder="Upload placeholder for now" />
            </Field>
            <Field label="Vanity URL">
              <Input value={slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} />
            </Field>
          </div>
          <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/55">
            Photo upload, email changes, and deeper account settings are foundation items for a later pass.
          </p>
          <Button type="submit">Save Profile</Button>
          {message ? <p className="text-sm font-bold text-spruce">{message}</p> : null}
        </form>

        <aside id="share" className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm lg:self-start">
          <div>
            <h2 className="text-xl font-black">Share your Giftly link</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Friends and family can scan this to connect with you or find gift ideas you choose to share.
            </p>
          </div>
          <QrCard url={shareUrl} />
          <Button type="button" variant="ghost" onClick={copyShareLink}>
            <Share2 size={16} />
            Copy share link
          </Button>
        </aside>
      </div>

      <section id="settings" className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Account settings</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
          Password changes, notification preferences, and privacy defaults will live here.
        </p>
      </section>

      <section id="delete-account" className="rounded-[2rem] border border-berry/20 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-berry">Delete account</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
          Account deletion needs a careful confirmation flow. This is intentionally a placeholder until that flow is built safely.
        </p>
      </section>
    </main>
  );
}
