"use client";

import Link from "next/link";
import { Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import type { Connection, GiftGroup, GroupLabel } from "@/lib/types";
import { Button, Field, Input, Select } from "./ui";

export function ProfilesClient() {
  const { profiles, gifts, connections = [], groups = [], wishlistShares = [], actionError, actions, ready } = useGiftlyStore();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupInviteDrafts, setGroupInviteDrafts] = useState<Record<string, string>>({});
  const [groupMemberDrafts, setGroupMemberDrafts] = useState<Record<string, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    realName: "",
    displayName: "",
    relationship: "",
    emailOrPhone: ""
  });

  const bubbleConnections = useMemo(
    () => connections.filter((connection) => connection.status === "ACCEPTED" || connection.emailOrPhone || connection.targetUserId),
    [connections]
  );
  const filteredConnections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return bubbleConnections;
    return bubbleConnections.filter((connection) =>
      [connection.displayName, connection.realName, connection.emailOrPhone, connection.relationshipType, connection.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    );
  }, [bubbleConnections, search]);

  if (!ready) return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading your Bubble...</main>;

  function connectionLabel(connection: Connection) {
    return connection.displayName || connection.realName || connection.emailOrPhone || "Connected person";
  }

  function groupIdsForConnection(connectionId: string) {
    return groups.filter((group) => group.members.some((member) => member.connectionId === connectionId)).map((group) => group.id);
  }

  function groupNamesForConnection(connectionId: string) {
    return groups.filter((group) => group.members.some((member) => member.connectionId === connectionId)).map((group) => group.name);
  }

  function sharedProfilesForConnection(connection: Connection) {
    const memberGroupIds = groupIdsForConnection(connection.id);
    const shares = wishlistShares.filter(
      (share) =>
        share.connectionId === connection.id ||
        Boolean(share.groupId && memberGroupIds.includes(share.groupId) && !share.excludedConnectionIds.includes(connection.id))
    );
    const profileIds = Array.from(new Set(shares.map((share) => share.profileId)));
    return profiles.filter((profile) => profileIds.includes(profile.id));
  }

  function sharedGiftCountForConnection(connection: Connection) {
    const profileIds = new Set(sharedProfilesForConnection(connection).map((profile) => profile.id));
    return gifts.filter((gift) => profileIds.has(gift.profileId) && !gift.hiddenFromRecipient && gift.visibility !== "private").length;
  }

  function groupLabelForName(group?: GiftGroup): { groupLabel: GroupLabel; customGroupLabel?: string } {
    if (!group) return { groupLabel: "FRIENDS" };
    if (group.name === "Family") return { groupLabel: "FAMILY" };
    if (group.name === "Friends") return { groupLabel: "FRIENDS" };
    return { groupLabel: "CUSTOM", customGroupLabel: group.name };
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => (current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]));
  }

  async function createBubbleConnection(event: React.FormEvent) {
    event.preventDefault();
    try {
      const primaryGroup = groups.find((group) => group.id === selectedGroupIds[0]);
      const created = await actions.createConnection({
        realName: form.realName,
        displayName: form.displayName,
        relationshipType: form.relationship,
        emailOrPhone: form.emailOrPhone,
        source: "MANUAL",
        ...groupLabelForName(primaryGroup)
      });
      for (const groupId of selectedGroupIds) {
        await actions.addGroupMember(groupId, { connectionId: created.id });
      }
      await actions.refresh();
      setForm({ realName: "", displayName: "", relationship: "", emailOrPhone: "" });
      setSelectedGroupIds([]);
      setShowForm(false);
    } catch {
      // The shared store surfaces the friendly error message.
    }
  }

  async function createGiftGroup() {
    if (!newGroupName.trim()) return;
    await actions.createGroup({ name: newGroupName.trim() });
    setNewGroupName("");
    await actions.refresh();
  }

  async function deleteBubblePerson(connection: Connection) {
    if (!window.confirm(`Delete ${connectionLabel(connection)} from your Bubble? This removes them from groups and sharing lists, but does not delete their own Giftly account.`)) return;
    await actions.deleteConnection(connection.id);
    await actions.refresh();
  }

  async function deleteGroup(group: GiftGroup) {
    if (!window.confirm(`Delete the ${group.name} group? People stay in your Bubble.`)) return;
    await actions.deleteGroup(group.id);
    await actions.refresh();
  }

  async function inviteToGroup(group: GiftGroup) {
    const value = groupInviteDrafts[group.id]?.trim();
    if (!value) return;
    const created = await actions.createConnection({
      emailOrPhone: value,
      displayName: value,
      groupId: group.id,
      source: "EMAIL",
      ...groupLabelForName(group)
    });
    await actions.addGroupMember(group.id, { connectionId: created.id });
    setGroupInviteDrafts((current) => ({ ...current, [group.id]: "" }));
    await actions.refresh();
  }

  async function addBubblePersonToGroup(groupId: string) {
    const connectionId = groupMemberDrafts[groupId];
    if (!connectionId) return;
    await actions.addGroupMember(groupId, { connectionId });
    setGroupMemberDrafts((current) => ({ ...current, [groupId]: "" }));
    await actions.refresh();
  }

  async function removeMember(groupId: string, memberId: string) {
    await actions.removeGroupMember(groupId, memberId);
    await actions.refresh();
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}

      <section className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">My Bubble</p>
            <h1 className="text-3xl font-black">Your Bubble</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
              People connected to you. You choose which wishlists to share.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <UserPlus size={17} />
            Add someone
          </Button>
        </div>
        <label className="grid gap-2 rounded-3xl bg-cloud p-3 text-sm font-bold text-ink">
          <span className="inline-flex items-center gap-2 text-ink/60">
            <Search size={16} />
            Search people in your Bubble
          </span>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, relationship, or status" />
        </label>
      </section>

      {showForm ? (
        <form onSubmit={createBubbleConnection} className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black">Invite or add someone</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">Add their contact info now. They can join Giftly later.</p>
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
          </div>
          <div className="grid gap-2">
            <p className="text-sm font-bold">Groups</p>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <label className="flex items-center gap-2 rounded-full bg-cloud px-3 py-2 text-sm font-black text-ink/70" key={group.id}>
                  <input type="checkbox" checked={selectedGroupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />
                  {group.name}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit">Save person</Button>
        </form>
      ) : null}

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-berry">People</p>
            <h2 className="text-2xl font-black">Connected people</h2>
          </div>
          <p className="text-sm font-bold text-ink/50">{filteredConnections.length} shown</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredConnections.length ? filteredConnections.map((connection) => {
            const sharedProfiles = sharedProfilesForConnection(connection);
            return (
              <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" key={connection.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{connectionLabel(connection)}</h3>
                    {connection.realName && connection.realName !== connection.displayName ? <p className="text-sm font-semibold text-ink/55">{connection.realName}</p> : null}
                    <p className="text-sm font-semibold text-ink/55">
                      {[connection.emailOrPhone, connection.relationshipType, connection.status.toLowerCase()].filter(Boolean).join(" - ")}
                    </p>
                  </div>
                  <Button type="button" variant="danger" onClick={() => deleteBubblePerson(connection)} aria-label={`Delete ${connectionLabel(connection)}`}>
                    <Trash2 size={15} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {groupNamesForConnection(connection.id).length ? groupNamesForConnection(connection.id).map((name) => (
                    <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-spruce" key={name}>{name}</span>
                  )) : <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-ink/50">No group yet</span>}
                </div>
                <div className="grid gap-2 rounded-2xl bg-cloud p-3 text-xs font-bold text-ink/60">
                  <p>{sharedProfiles.length} {sharedProfiles.length === 1 ? "wishlist" : "wishlists"} shared with them</p>
                  <p>{sharedGiftCountForConnection(connection)} {sharedGiftCountForConnection(connection) === 1 ? "item" : "items"} available through shared wishlists</p>
                  {sharedProfiles.length ? (
                    <div className="flex flex-wrap gap-2">
                      {sharedProfiles.map((profile) => (
                        <Link className="rounded-full bg-white px-3 py-1 font-black text-spruce underline" href={`/profiles/${profile.slug}`} key={profile.id}>
                          {profile.displayName}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {connection.targetUserId ? <p className="font-black text-spruce">Connected Giftly account</p> : null}
                </div>
              </article>
            );
          }) : (
            <p className="rounded-[1.5rem] bg-white p-4 text-sm font-bold text-ink/55 shadow-sm">No people match your search.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">Groups</p>
            <h2 className="text-2xl font-black">Manage groups</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-[16rem_auto]">
            <Input value={newGroupName} onChange={(event) => setNewGroupName(event.target.value)} placeholder="Coworkers, Wedding Party..." />
            <Button type="button" variant="secondary" onClick={createGiftGroup}>
              <Plus size={16} />
              Add Group
            </Button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" key={group.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{group.name}</h3>
                  <p className="text-sm font-semibold text-ink/55">{group.members.length} members or pending invites</p>
                </div>
                <Button type="button" variant="danger" onClick={() => deleteGroup(group)} aria-label={`Delete ${group.name}`}>
                  <Trash2 size={15} />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.members.length ? group.members.map((member) => {
                  const connection = connections.find((item) => item.id === member.connectionId);
                  return (
                    <span className="inline-flex items-center gap-2 rounded-full bg-cloud px-3 py-1 text-xs font-black text-ink/60" key={member.id}>
                      {connection ? connectionLabel(connection) : member.pendingEmailOrPhone || "Pending"}
                      <button type="button" className="text-berry" onClick={() => removeMember(group.id, member.id)} aria-label="Remove from group">
                        <X size={13} />
                      </button>
                    </span>
                  );
                }) : <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-ink/45">No members yet</span>}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Select value={groupMemberDrafts[group.id] ?? ""} onChange={(event) => setGroupMemberDrafts({ ...groupMemberDrafts, [group.id]: event.target.value })}>
                  <option value="">Add existing Bubble person</option>
                  {bubbleConnections
                    .filter((connection) => !groupIdsForConnection(connection.id).includes(group.id))
                    .map((connection) => (
                      <option key={connection.id} value={connection.id}>{connectionLabel(connection)}</option>
                    ))}
                </Select>
                <Button type="button" variant="ghost" onClick={() => addBubblePersonToGroup(group.id)}>Add</Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input value={groupInviteDrafts[group.id] ?? ""} onChange={(event) => setGroupInviteDrafts({ ...groupInviteDrafts, [group.id]: event.target.value })} placeholder="Invite by email or mobile" />
                <Button type="button" variant="ghost" onClick={() => inviteToGroup(group)}>Invite</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
