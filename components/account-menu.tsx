"use client";

import Link from "next/link";
import { HelpCircle, LogOut, MessageSquare, QrCode, Settings, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { Avatar } from "./avatar";

type AccountMenuProps = {
  user: {
    name: string;
    email: string;
  };
};

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-ink/10"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open account menu"
        aria-expanded={open}
      >
        <Avatar name={user.name} className="h-9 w-9" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-40 w-72 overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
          <div className="border-b border-ink/10 p-4">
            <p className="font-black">{user.name}</p>
            <p className="text-sm font-semibold text-ink/55">{user.email}</p>
          </div>
          <div className="grid p-2 text-sm font-bold">
            <MenuLink href="/my-profile" icon={<UserRound size={16} />} label="My Profile" />
            <MenuLink href="/my-profile#settings" icon={<Settings size={16} />} label="Settings" />
            <MenuLink href="/my-profile#share" icon={<QrCode size={16} />} label="QR Code / Share My Giftly Link" />
            <div className="my-1 border-t border-ink/10" />
            <MenuLink href="/help/faq" icon={<HelpCircle size={16} />} label="FAQ" />
            <MenuLink href="/help/contact" icon={<MessageSquare size={16} />} label="Contact Us" />
            <MenuLink href="/help/feedback" icon={<MessageSquare size={16} />} label="Feedback" />
            <div className="my-1 border-t border-ink/10" />
            <MenuLink href="/my-profile#delete-account" icon={<Trash2 size={16} />} label="Delete Account" danger />
            <MenuLink href="/logout" icon={<LogOut size={16} />} label="Log Out" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({ href, icon, label, danger = false }: { href: string; icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <Link
      className={`flex items-center gap-2 rounded-2xl px-3 py-2 hover:bg-blush ${danger ? "text-berry" : "text-ink"}`}
      href={href}
      prefetch={href !== "/logout" ? undefined : false}
    >
      {icon}
      {label}
    </Link>
  );
}
