"use client";

import { Copy, Mail, Share2, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GiftGroup, GroupLabel } from "@/lib/types";
import { Button, Field, Input, Select } from "./ui";
import { QrCard } from "./qr-card";

function isStaleDemoGroup(label: string) {
  const normalized = label.trim().toLowerCase();
  return (
    ["wedding", "household", "kids", "couples"].includes(normalized) ||
    normalized.includes("brian") ||
    normalized.includes("becky")
  );
}

function connectionGroupFor(label: string): { groupLabel: GroupLabel; customGroupLabel?: string } {
  if (label === "Family") return { groupLabel: "FAMILY" };
  if (label === "Friends") return { groupLabel: "FRIENDS" };
  return { groupLabel: "CUSTOM", customGroupLabel: label };
}

type InviteModalProps = {
  open: boolean;
  title?: string;
  profileUrl: string;
  existingGroups: string[];
  groups?: GiftGroup[];
  initialMode?: "existing" | "new";
  onClose: () => void;
  onCreateGroup?: (name: string) => Promise<GiftGroup>;
  onInvite: (input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string; groupId?: string }) => Promise<void>;
};

export function InviteModal({ open, title = "Invite Friends & Family", profileUrl, existingGroups, groups = [], initialMode = "existing", onClose, onCreateGroup, onInvite }: InviteModalProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const groupOptions = useMemo(() => {
    const byId = groups.filter((group) => !isStaleDemoGroup(group.name));
    const fallback = existingGroups
      .filter((name) => Boolean(name) && !isStaleDemoGroup(name))
      .map((name) => ({ id: `label:${name}`, name } as GiftGroup));
    const starterGroups = ["Family", "Friends"].map((name) => ({ id: `label:${name}`, name } as GiftGroup));
    return byId.length ? byId : fallback.length ? fallback : starterGroups;
  }, [existingGroups, groups]);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [initialMode, open]);

  useEffect(() => {
    if (!open || selectedGroupId || !groupOptions.length) return;
    setSelectedGroupId(groupOptions[0].id);
  }, [groupOptions, open, selectedGroupId]);

  if (!open) return null;

  async function copyLink() {
    await navigator.clipboard?.writeText(profileUrl);
    setMessage("Invite link copied.");
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({
        title: "Join me on Giftly",
        text: "I am using Giftly to make wishlists and gift planning easier.",
        url: profileUrl
      });
      return;
    }
    await copyLink();
  }

  async function saveInvite() {
    setMessage("");
    const selectedGroup = groupOptions.find((group) => group.id === selectedGroupId);
    let groupName = mode === "new" ? newGroup.trim() : selectedGroup?.name ?? "Family";
    let groupId = mode === "new" ? undefined : selectedGroup?.id.startsWith("label:") ? undefined : selectedGroup?.id;
    if (mode === "new" && !groupName) {
      setMessage("Name the group first.");
      return;
    }
    if (!emailOrPhone.trim()) {
      setMessage("Add an email or mobile number first.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "new" && onCreateGroup) {
        const createdGroup = await onCreateGroup(groupName);
        groupName = createdGroup.name;
        groupId = createdGroup.id;
      }
      await onInvite({
        emailOrPhone: emailOrPhone.trim(),
        groupId,
        ...connectionGroupFor(groupName)
      });
      setEmailOrPhone("");
      setNewGroup("");
      if (groupId) setSelectedGroupId(groupId);
      setMode("existing");
      setMessage("Invite saved as a pending connection.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-ink/40 p-0 sm:place-items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-[2rem] bg-white p-4 shadow-soft sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-berry">Giftly works better with friends & family</p>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">
              Share wishlists, plan around events, and start group spaces for real-world gifting.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close invite modal">
            <X size={16} />
          </Button>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 rounded-3xl bg-cloud p-3">
            <div className="grid place-items-center">
              <QrCard url={profileUrl} />
            </div>
            <Field label="Invite link">
              <Input readOnly value={profileUrl} />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={copyLink}>
                <Copy size={16} />
                Copy invite link
              </Button>
              <Button type="button" onClick={shareLink}>
                <Share2 size={16} />
                Share
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-ink/10 p-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-berry" />
              <h3 className="font-black">Add someone</h3>
            </div>
            <Field label="Email or mobile">
              <Input value={emailOrPhone} onChange={(event) => setEmailOrPhone(event.target.value)} placeholder="name@example.com" />
            </Field>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-2xl bg-cloud p-3 text-sm font-black">
                <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} />
                Add to existing group
              </label>
              <label className="flex items-center gap-2 rounded-2xl bg-cloud p-3 text-sm font-black">
                <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} />
                Create group
              </label>
            </div>
            {mode === "existing" ? (
              <Field label="Group">
                <Select value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)}>
                  {groupOptions.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="New group">
                <Input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="Book club, neighbors, holiday crew..." />
              </Field>
            )}
            <p className="rounded-2xl bg-blush p-3 text-xs font-bold leading-5 text-berry">
              Future groups can control shared wishlist visibility, event visibility, collaborative gifting, and surprise-safe buying.
            </p>
            <Button type="button" onClick={saveInvite} disabled={saving}>
              <UsersRound size={16} />
              {saving ? "Saving..." : "Save pending invite"}
            </Button>
          </div>

          {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
