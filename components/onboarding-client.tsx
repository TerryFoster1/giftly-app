"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Share2, Sparkles, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import type { GroupLabel } from "@/lib/types";
import { publicProfileUrl } from "@/lib/url";
import { Button, Field, Input, Select } from "./ui";

type RelationshipKey = "partner" | "kids" | "parents" | "siblings" | "friends" | "coworkers" | "event";

type PersonDraft = {
  id: string;
  type: RelationshipKey;
  name: string;
  contact: string;
  birthday: string;
};

const relationshipOptions: Array<{ value: RelationshipKey; label: string; groupLabel: GroupLabel; relationship: string; prompt: string }> = [
  { value: "partner", label: "Spouse/partner", groupLabel: "PARTNER", relationship: "Partner", prompt: "Partner's name" },
  { value: "kids", label: "Kids", groupLabel: "FAMILY", relationship: "Child", prompt: "Child's name" },
  { value: "parents", label: "Parents", groupLabel: "FAMILY", relationship: "Parent", prompt: "Parent's name" },
  { value: "siblings", label: "Siblings", groupLabel: "FAMILY", relationship: "Sibling", prompt: "Sibling's name" },
  { value: "friends", label: "Friends", groupLabel: "FRIENDS", relationship: "Friend", prompt: "Friend's name" },
  { value: "coworkers", label: "Coworkers", groupLabel: "CUSTOM", relationship: "Coworker", prompt: "Coworker's name" },
  { value: "event", label: "Wedding/event", groupLabel: "CUSTOM", relationship: "Event", prompt: "Event or person name" }
];

function groupLabelFor(type: RelationshipKey) {
  return relationshipOptions.find((option) => option.value === type)?.groupLabel ?? "FAMILY";
}

function customGroupFor(type: RelationshipKey) {
  if (type === "coworkers") return "Coworkers";
  if (type === "event") return "Events";
  return undefined;
}

function relationshipFor(type: RelationshipKey) {
  return relationshipOptions.find((option) => option.value === type)?.relationship ?? "Friend";
}

function promptFor(type: RelationshipKey) {
  return relationshipOptions.find((option) => option.value === type)?.prompt ?? "Name";
}

export function OnboardingClient() {
  const router = useRouter();
  const { user, profiles, ready, actionError, actions } = useGiftlyStore();
  const [people, setPeople] = useState<PersonDraft[]>([
    { id: crypto.randomUUID(), type: "partner", name: "", contact: "", birthday: "" },
    { id: crypto.randomUUID(), type: "kids", name: "", contact: "", birthday: "" },
    { id: crypto.randomUUID(), type: "friends", name: "", contact: "", birthday: "" }
  ]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const primaryProfile = profiles.find((profile) => profile.isPrimary) ?? profiles[0];
  const shareUrl = useMemo(() => (primaryProfile ? publicProfileUrl(primaryProfile.slug) : ""), [primaryProfile]);

  function updatePerson(id: string, patch: Partial<PersonDraft>) {
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, ...patch } : person)));
  }

  function addPerson(type: RelationshipKey) {
    setPeople((current) => [...current, { id: crypto.randomUUID(), type, name: "", contact: "", birthday: "" }]);
  }

  function removePerson(id: string) {
    setPeople((current) => current.filter((person) => person.id !== id));
  }

  async function copyInviteLink() {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
  }

  async function shareInviteLink() {
    if (!shareUrl) return;
    if (navigator.share) {
      await navigator.share({
        title: "Join me on Giftly",
        text: "I am building my Giftly wishlists so gifting is easier for our family and friends.",
        url: shareUrl
      });
      return;
    }
    await copyInviteLink();
  }

  async function finishOnboarding() {
    setSaving(true);
    setMessage("");
    try {
      for (const person of people) {
        const name = person.name.trim();
        const contact = person.contact.trim();
        const groupLabel = groupLabelFor(person.type);
        const customGroupLabel = customGroupFor(person.type);

        if (name) {
          await actions.createProfile({
            displayName: name,
            relationship: relationshipFor(person.type),
            bio: "",
            photoUrl: "",
            birthday: person.birthday,
            anniversary: "",
            groupLabel,
            customGroupLabel,
            listVisibility: "shared"
          });
        }

        if (contact) {
          await actions.createConnection({
            emailOrPhone: contact,
            groupLabel,
            customGroupLabel
          });
        }
      }

      await actions.refresh();
      window.localStorage.setItem("giftly_onboarding_dismissed", "true");
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Onboarding could not be saved. You can skip and finish later.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <main className="mx-auto max-w-5xl px-4 py-10 font-bold">Loading setup...</main>;

  return (
    <main className="mx-auto grid max-w-5xl gap-5 px-4 py-6">
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase text-berry">Giftly setup</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Who do you usually buy gifts for?</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
          Add a few real people now. Giftly will create useful starter wishlists and invite-ready group connections without making you send anything yet.
        </p>
      </section>

      <section className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <UsersRound size={18} className="text-berry" />
          <h2 className="text-xl font-black">People and events</h2>
        </div>

        <div className="grid gap-3">
          {people.map((person) => (
            <article className="grid gap-3 rounded-3xl bg-cloud p-3" key={person.id}>
              <div className="grid gap-3 sm:grid-cols-[0.8fr_1fr_1fr_0.8fr_auto] sm:items-end">
                <Field label="Type">
                  <Select value={person.type} onChange={(event) => updatePerson(person.id, { type: event.target.value as RelationshipKey })}>
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label={promptFor(person.type)}>
                  <Input value={person.name} onChange={(event) => updatePerson(person.id, { name: event.target.value })} placeholder="Name" />
                </Field>
                <Field label="Email or phone">
                  <Input value={person.contact} onChange={(event) => updatePerson(person.id, { contact: event.target.value })} placeholder="Optional" />
                </Field>
                <Field label="Birthday/event date">
                  <Input type="date" value={person.birthday} onChange={(event) => updatePerson(person.id, { birthday: event.target.value })} />
                </Field>
                <Button type="button" variant="ghost" onClick={() => removePerson(person.id)}>Remove</Button>
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {relationshipOptions.map((option) => (
            <Button type="button" variant="ghost" key={option.value} onClick={() => addPerson(option.value)}>
              Add {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Share2 size={18} className="text-berry" />
          <h2 className="text-xl font-black">Invite loop foundation</h2>
        </div>
        <p className="text-sm font-semibold leading-6 text-ink/60">
          Your profile link is ready to copy or share now. Email and SMS sending can plug into these pending connections later.
        </p>
        <div className="grid gap-2 rounded-3xl bg-cloud p-3 sm:grid-cols-[1fr_auto_auto]">
          <Input readOnly value={shareUrl} />
          <Button type="button" variant="secondary" onClick={copyInviteLink}>
            <Copy size={16} />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" onClick={shareInviteLink}>
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </section>

      <section className="grid gap-3 rounded-[2rem] border border-dashed border-ink/15 bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-berry" />
          <h2 className="text-xl font-black">What Giftly creates</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {["My Birthday wishlist, shared", "Cool Stuff wishlist, private", "Family and Friends group paths", "Birthday/event placeholders for people you add"].map((item) => (
            <p className="rounded-2xl bg-cloud p-3 text-sm font-black text-ink/65" key={item}>{item}</p>
          ))}
        </div>
      </section>

      {message || actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{message || actionError}</p> : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={finishOnboarding} disabled={saving}>
          {saving ? "Saving setup..." : "Save setup"}
        </Button>
        <Link
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-2xl border border-ink/10 bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-blush"
          href="/dashboard"
          onClick={() => window.localStorage.setItem("giftly_onboarding_dismissed", "true")}
        >
          Skip for now
        </Link>
      </div>
    </main>
  );
}
