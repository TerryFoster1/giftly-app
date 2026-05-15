"use client";

import Link from "next/link";
import { Plus, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import { formatEventDate } from "@/lib/events";
import type { GroupLabel } from "@/lib/types";
import { bubbleInviteUrl, publicProfilePath } from "@/lib/url";
import { Avatar } from "./avatar";
import { Button, Field, Input, Select } from "./ui";
import { InviteModal } from "./invite-modal";

export function ProfilesClient() {
  const { user, profiles, connections = [], groups = [], wishlistShares = [], actionError, actions, ready } = useGiftlyStore();
  const [showForm, setShowForm] = useState(false);
  const [shareSlug, setShareSlug] = useState("");
  const [vanityDrafts, setVanityDrafts] = useState<Record<string, string>>({});
  const [eventDrafts, setEventDrafts] = useState<Record<string, { birthday: string; anniversary: string }>>({});
  const [newGroupName, setNewGroupName] = useState("");
  const [groupInviteDrafts, setGroupInviteDrafts] = useState<Record<string, string>>({});
  const [groupMemberDrafts, setGroupMemberDrafts] = useState<Record<string, string>>({});
  const [shareGroupDrafts, setShareGroupDrafts] = useState<Record<string, string>>({});
  const [shareConnectionDrafts, setShareConnectionDrafts] = useState<Record<string, string>>({});
  const [shareExcludeDrafts, setShareExcludeDrafts] = useState<Record<string, string[]>>({});
  const [vanityMessage, setVanityMessage] = useState("");
  const [eventMessage, setEventMessage] = useState("");
  const [form, setForm] = useState({
    realName: "",
    displayName: "",
    relationship: "",
    emailOrPhone: "",
    groupLabel: "FAMILY" as GroupLabel,
    customGroupLabel: ""
  });

  if (!ready) return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading your gift circle...</main>;

  async function createBubbleConnection(event: React.FormEvent) {
    event.preventDefault();
    try {
      await actions.createConnection({
        realName: form.realName,
        displayName: form.displayName,
        relationshipType: form.relationship,
        emailOrPhone: form.emailOrPhone,
        groupLabel: form.groupLabel,
        customGroupLabel: form.customGroupLabel,
        source: "MANUAL"
      });
      setForm({ realName: "", displayName: "", relationship: "", emailOrPhone: "", groupLabel: "FAMILY", customGroupLabel: "" });
      setShowForm(false);
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function deleteProfile(id: string, name: string) {
    if (!window.confirm(`Delete ${name}? This will also delete that wishlist's items, reservations, and contribution records.`)) return;
    try {
      await actions.deleteProfile(id);
      if (profiles.find((profile) => profile.id === id)?.slug === shareSlug) setShareSlug("");
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
      setEventMessage("Dates saved.");
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function saveInvite(input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string; groupId?: string }) {
    await actions.createConnection({ ...input, source: "INVITE_LINK" });
    await actions.refresh();
  }

  async function createShareGroup(name: string) {
    const group = await actions.createGroup({ name });
    await actions.refresh();
    return group;
  }

  async function createGiftGroup() {
    if (!newGroupName.trim()) return;
    await actions.createGroup({ name: newGroupName.trim() });
    setNewGroupName("");
    await actions.refresh();
  }

  async function inviteToGroup(groupId: string) {
    const value = groupInviteDrafts[groupId]?.trim();
    if (!value) return;
    await actions.createConnection({ emailOrPhone: value, displayName: value, groupId, source: "EMAIL", groupLabel: "CUSTOM", customGroupLabel: groups.find((group) => group.id === groupId)?.name });
    setGroupInviteDrafts((current) => ({ ...current, [groupId]: "" }));
    await actions.refresh();
  }

  async function addBubblePersonToGroup(groupId: string) {
    const connectionId = groupMemberDrafts[groupId];
    if (!connectionId) return;
    await actions.addGroupMember(groupId, { connectionId });
    setGroupMemberDrafts((current) => ({ ...current, [groupId]: "" }));
    await actions.refresh();
  }

  async function shareWithGroup(profileId: string) {
    const groupId = shareGroupDrafts[profileId];
    if (!groupId) return;
    await actions.shareWishlist({ profileId, groupId, excludedConnectionIds: shareExcludeDrafts[profileId] ?? [] });
    await actions.refresh();
  }

  async function shareWithConnection(profileId: string) {
    const connectionId = shareConnectionDrafts[profileId];
    if (!connectionId) return;
    await actions.shareWishlist({ profileId, connectionId });
    await actions.refresh();
  }

  const groupOptions: GroupLabel[] = ["FAMILY", "FRIENDS", "PARTNER", "GUESTS", "CUSTOM"];
  const existingGroupNames = groups.map((group) => group.name);
  const bubbleConnections = connections.filter((connection) => connection.status === "ACCEPTED" || connection.emailOrPhone || connection.targetUserId);
  const currentShareProfile = profiles.find((profile) => profile.slug === shareSlug);

  function connectionLabel(connection: (typeof connections)[number]) {
    if (connection.displayName) return connection.displayName;
    if (connection.realName) return connection.realName;
    if (connection.emailOrPhone) return connection.emailOrPhone;
    if (connection.targetUserId) return "Connected Giftly user";
    return "Connected person";
  }

  function shareCountForProfile(profileId: string) {
    return wishlistShares.filter((share) => share.profileId === profileId).length;
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
      <section className="grid gap-4">
        {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}
        <div className="flex flex-col gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">My Bubble</p>
            <h1 className="text-3xl font-black">Your gifting circle</h1>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Your Bubble is everyone connected to you. People in your Bubble cannot automatically see your wishlists. You choose what to share and with whom.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <Plus size={17} />
            Add someone to your Bubble
          </Button>
        </div>
        {showForm ? (
          <form onSubmit={createBubbleConnection} className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <div>
              <h2 className="text-xl font-black">Add someone to your Bubble</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
                Add a real person, send them an invite link, and keep your own label for them. They create their own Giftly account when they join.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Real name">
                <Input required value={form.realName} onChange={(event) => setForm({ ...form, realName: event.target.value })} placeholder="Kevin Foster" />
              </Field>
              <Field label="Display name">
                <Input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Dad" />
              </Field>
              <Field label="Relationship">
                <Input required value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} placeholder="Father" />
              </Field>
              <Field label="Email or phone">
                <Input required value={form.emailOrPhone} onChange={(event) => setForm({ ...form, emailOrPhone: event.target.value })} placeholder="name@example.com or mobile" />
              </Field>
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
            <p className="rounded-2xl bg-cloud p-3 text-xs font-bold leading-5 text-ink/55">
              Saving creates a pending Bubble connection. They will join through an invite link and manage their own account; you still see your personal label, like Dad or Coach.
            </p>
            <Button type="submit">Save and create invite</Button>
          </form>
        ) : null}
        {connections.length ? (
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black">Invites and Connections</h2>
            <div className="mt-3 grid gap-2">
              {connections.map((connection) => (
                <div className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65" key={connection.id}>
                  {connectionLabel(connection)} · {connection.status.toLowerCase()} · {connection.source.toLowerCase().replace("_", " ")}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-black uppercase text-berry">Bubble</p>
            <h2 className="text-xl font-black">People connected to you</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Your Bubble is your connected people. They do not automatically see wishlists until you share a wishlist with a person or group.
            </p>
          </div>
          {bubbleConnections.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {bubbleConnections.map((connection) => (
                <div className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/65" key={connection.id}>
                  <span className="block text-ink">{connectionLabel(connection)}</span>
                  <span className="text-xs uppercase text-ink/45">{connection.status.toLowerCase()} connection</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-cloud p-3 text-sm font-bold text-ink/55">
              Share your Giftly link or invite someone by email/mobile to start building your Bubble.
            </p>
          )}
        </section>
        <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-black uppercase text-berry">Groups</p>
            <h2 className="text-xl font-black">Family, friends, and smaller circles</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Groups are subsets of your Bubble. Use them later for wishlist access, event visibility, and surprise-safe planning.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Create a group, like Neighbors or Book Club" />
            <Button type="button" variant="secondary" onClick={createGiftGroup}>Add Group</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((group) => (
              <article className="grid gap-3 rounded-3xl bg-cloud p-3" key={group.id}>
                <div>
                  <h3 className="text-lg font-black">{group.name}</h3>
                  <p className="text-xs font-bold uppercase text-ink/45">{group.members.length} members or pending invites</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Select value={groupMemberDrafts[group.id] ?? ""} onChange={(event) => setGroupMemberDrafts({ ...groupMemberDrafts, [group.id]: event.target.value })}>
                    <option value="">Add Bubble person</option>
                    {bubbleConnections.map((connection) => (
                      <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" onClick={() => addBubblePersonToGroup(group.id)}>Add</Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input value={groupInviteDrafts[group.id] ?? ""} onChange={(event) => setGroupInviteDrafts({ ...groupInviteDrafts, [group.id]: event.target.value })} placeholder="Invite by email or mobile" />
                  <Button type="button" variant="ghost" onClick={() => inviteToGroup(group.id)}>Invite</Button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-sm" key={profile.id}>
              <div className="flex gap-3">
                <Avatar name={profile.displayName} photoUrl={profile.photoUrl} />
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
                  This wishlist is managed by you for now. If this person joins Giftly later, they can connect and claim it through a safe ownership flow.
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 rounded-2xl bg-cloud p-3">
                <div>
                  <h3 className="text-sm font-black">Share this wishlist</h3>
                  <p className="mt-1 text-xs font-bold leading-5 text-ink/55">
                    Private until shared. Phase 1 grants wishlist-level access to Bubble people or groups. Item-level sharing and exclusions come later.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Select value={shareGroupDrafts[profile.id] ?? ""} onChange={(event) => setShareGroupDrafts({ ...shareGroupDrafts, [profile.id]: event.target.value })}>
                    <option value="">Share with group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" onClick={() => shareWithGroup(profile.id)}>Share</Button>
                </div>
                {shareGroupDrafts[profile.id] ? (
                  <div className="rounded-2xl bg-white p-3">
                    <p className="text-xs font-black uppercase text-ink/45">Except selected people</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {bubbleConnections.map((connection) => {
                        const selected = (shareExcludeDrafts[profile.id] ?? []).includes(connection.id);
                        return (
                          <label className="flex items-center gap-2 text-xs font-bold text-ink/60" key={connection.id}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const current = shareExcludeDrafts[profile.id] ?? [];
                                setShareExcludeDrafts({
                                  ...shareExcludeDrafts,
                                  [profile.id]: event.target.checked ? [...current, connection.id] : current.filter((id) => id !== connection.id)
                                });
                              }}
                            />
                            {connectionLabel(connection)}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Select value={shareConnectionDrafts[profile.id] ?? ""} onChange={(event) => setShareConnectionDrafts({ ...shareConnectionDrafts, [profile.id]: event.target.value })}>
                    <option value="">Share with person</option>
                    {bubbleConnections.map((connection) => (
                      <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>
                    ))}
                  </Select>
                  <Button type="button" variant="ghost" onClick={() => shareWithConnection(profile.id)}>Share</Button>
                </div>
                <p className="text-xs font-bold text-spruce">{shareCountForProfile(profile.id)} active share grants</p>
              </div>
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
      <InviteModal
        open={Boolean(shareSlug)}
        title="Share this wishlist"
        profileUrl={user && currentShareProfile ? bubbleInviteUrl(user.id, { wishlistId: currentShareProfile.id }) : ""}
        existingGroups={existingGroupNames}
        groups={groups}
        onCreateGroup={createShareGroup}
        onClose={() => setShareSlug("")}
        onInvite={saveInvite}
      />
    </main>
  );
}
