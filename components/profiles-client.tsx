"use client";

import { Plus, Share2, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { useGiftlyStore } from "@/lib/store";
import type { Connection, GiftGroup, GroupLabel } from "@/lib/types";
import { bubbleInviteUrl } from "@/lib/url";
import { Button, Field, Input, Select } from "./ui";
import { InviteModal } from "./invite-modal";

export function ProfilesClient() {
  const { user, profiles, connections = [], groups = [], wishlistShares = [], actionError, actions, ready } = useGiftlyStore();
  const [showForm, setShowForm] = useState(false);
  const [shareProfileId, setShareProfileId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [groupInviteDrafts, setGroupInviteDrafts] = useState<Record<string, string>>({});
  const [groupMemberDrafts, setGroupMemberDrafts] = useState<Record<string, string>>({});
  const [shareGroupDrafts, setShareGroupDrafts] = useState<Record<string, string>>({});
  const [shareConnectionDrafts, setShareConnectionDrafts] = useState<Record<string, string>>({});
  const [shareExcludeDrafts, setShareExcludeDrafts] = useState<Record<string, string[]>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    realName: "",
    displayName: "",
    relationship: "",
    emailOrPhone: ""
  });

  if (!ready) return <main className="mx-auto max-w-6xl px-4 py-10 font-bold">Loading your Bubble...</main>;

  const bubbleConnections = connections.filter((connection) => connection.status === "ACCEPTED" || connection.emailOrPhone || connection.targetUserId);
  const selectedWishlist = profiles.find((profile) => profile.id === shareProfileId);
  const shareableWishlists = profiles.filter((profile) => !profile.isPrimary || profile.ownerUserId === user?.id);

  function connectionLabel(connection: Connection) {
    return connection.displayName || connection.realName || connection.emailOrPhone || "Connected person";
  }

  function connectionSubtext(connection: Connection) {
    const parts = [connection.realName, connection.relationshipType, connection.status.toLowerCase()].filter(Boolean);
    return parts.join(" - ");
  }

  function groupIdsForConnection(connectionId: string) {
    return groups.filter((group) => group.members.some((member) => member.connectionId === connectionId)).map((group) => group.id);
  }

  function groupNamesForConnection(connectionId: string) {
    return groups.filter((group) => group.members.some((member) => member.connectionId === connectionId)).map((group) => group.name);
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
    if (!window.confirm(`Delete ${connectionLabel(connection)} from your Bubble? This removes them from all groups, but does not delete their own Giftly account.`)) return;
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

  async function saveInvite(input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string; groupId?: string }) {
    await actions.createConnection({ ...input, source: "INVITE_LINK" });
    await actions.refresh();
  }

  async function createShareGroup(name: string) {
    const group = await actions.createGroup({ name });
    await actions.refresh();
    return group;
  }

  function shareCountForProfile(profileId: string) {
    return wishlistShares.filter((share) => share.profileId === profileId).length;
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
      {actionError ? <p className="rounded-2xl bg-blush p-3 text-sm font-bold text-berry">{actionError}</p> : null}
      <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">My Bubble</p>
            <h1 className="text-3xl font-black">Your relationship phone book</h1>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-ink/60">
              Your Bubble is everyone connected to you. People in your Bubble cannot automatically see your wishlists. You choose what to share and with whom.
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <UserPlus size={17} />
            Add someone
          </Button>
        </div>
      </section>

      {showForm ? (
        <form onSubmit={createBubbleConnection} className="grid gap-4 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black">Add or invite someone</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Add a real person, keep your own display label, and place them in one or more groups.
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
          <Button type="submit">Save and create invite</Button>
        </form>
      ) : null}

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-berry">People</p>
            <h2 className="text-2xl font-black">In your Bubble</h2>
          </div>
          <p className="text-sm font-bold text-ink/50">{bubbleConnections.length} connected or pending</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {bubbleConnections.length ? bubbleConnections.map((connection) => (
            <article className="rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" key={connection.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{connectionLabel(connection)}</h3>
                  <p className="text-sm font-semibold text-ink/55">{connectionSubtext(connection)}</p>
                </div>
                <Button type="button" variant="danger" onClick={() => deleteBubblePerson(connection)} aria-label={`Delete ${connectionLabel(connection)}`}>
                  <Trash2 size={15} />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {groupNamesForConnection(connection.id).length ? groupNamesForConnection(connection.id).map((name) => (
                  <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-spruce" key={name}>{name}</span>
                )) : <span className="rounded-full bg-cloud px-3 py-1 text-xs font-black text-ink/50">No group yet</span>}
              </div>
            </article>
          )) : (
            <p className="rounded-[1.5rem] bg-white p-4 text-sm font-bold text-ink/55 shadow-sm">Add your first person to start building your Bubble.</p>
          )}
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase text-berry">Groups</p>
            <h2 className="text-2xl font-black">Subsets of your Bubble</h2>
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

      <section className="grid gap-3 rounded-[2rem] border border-ink/10 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-black uppercase text-berry">Wishlist sharing</p>
          <h2 className="text-2xl font-black">Grant access when you are ready</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
            Wishlists stay private until you share them with a person or group. Group exclusions are saved as foundation data for the future permissions engine.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {shareableWishlists.map((profile) => (
            <article className="grid gap-3 rounded-3xl bg-cloud p-3" key={profile.id}>
              <div>
                <h3 className="font-black">{profile.displayName}</h3>
                <p className="text-xs font-bold text-ink/50">{shareCountForProfile(profile.id)} active share grants</p>
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
              <Button type="button" variant="secondary" onClick={() => setShareProfileId(profile.id)}>
                <Share2 size={16} />
                Share link
              </Button>
            </article>
          ))}
        </div>
      </section>

      <InviteModal
        open={Boolean(shareProfileId)}
        title="Share this wishlist"
        profileUrl={user && selectedWishlist ? bubbleInviteUrl(user.id, { wishlistId: selectedWishlist.id }) : ""}
        existingGroups={groups.map((group) => group.name)}
        groups={groups}
        onCreateGroup={createShareGroup}
        onClose={() => setShareProfileId("")}
        onInvite={saveInvite}
      />
    </main>
  );
}
