"use client";

import { Copy, Mail, QrCode, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GroupLabel } from "@/lib/types";
import { Button, Field, Input, Select } from "./ui";
import { QrCard } from "./qr-card";

const standardGroups = ["Family", "Friends"];

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
  initialMode?: "existing" | "new";
  onClose: () => void;
  onInvite: (input: { emailOrPhone?: string; groupLabel: GroupLabel; customGroupLabel?: string }) => Promise<void>;
};

export function InviteModal({ open, title = "Invite Friends & Family", profileUrl, existingGroups, initialMode = "existing", onClose, onInvite }: InviteModalProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedGroup, setSelectedGroup] = useState("Family");
  const [newGroup, setNewGroup] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const groupOptions = useMemo(() => {
    const names = Array.from(new Set([...standardGroups, ...existingGroups].filter(Boolean)));
    return names;
  }, [existingGroups]);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [initialMode, open]);

  if (!open) return null;

  async function copyLink() {
    await navigator.clipboard?.writeText(profileUrl);
    setMessage("Invite link copied.");
  }

  async function saveInvite() {
    setMessage("");
    const groupName = mode === "new" ? newGroup.trim() : selectedGroup;
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
      await onInvite({
        emailOrPhone: emailOrPhone.trim(),
        ...connectionGroupFor(groupName)
      });
      setEmailOrPhone("");
      setNewGroup("");
      setSelectedGroup(groupName);
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
          <div className="grid gap-2 rounded-3xl bg-cloud p-3">
            <Field label="Invite link">
              <Input readOnly value={profileUrl} />
            </Field>
            <Button type="button" variant="secondary" onClick={copyLink}>
              <Copy size={16} />
              Copy invite link
            </Button>
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
                <Select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
                  {groupOptions.map((group) => (
                    <option key={group} value={group}>
                      {group}
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

          <div className="grid gap-2 rounded-3xl bg-cloud p-3">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-berry" />
              <h3 className="font-black">QR code</h3>
            </div>
            <QrCard url={profileUrl} />
          </div>

          {message ? <p className="rounded-2xl bg-mint p-3 text-sm font-bold text-spruce">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
