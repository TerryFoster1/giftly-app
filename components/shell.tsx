import Link from "next/link";
import { Gift, Home, LogOut, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Brand } from "./brand";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-blush/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Brand href={user ? "/dashboard" : "/"} />
          <nav className="hidden items-center gap-2 md:flex">
            <Link className="rounded-full px-4 py-2 text-sm font-bold hover:bg-white" href="/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-full px-4 py-2 text-sm font-bold hover:bg-white" href="/profiles">
              People
            </Link>
            {user ? (
              <Link className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold hover:bg-white" href="/logout" prefetch={false}>
                <LogOut size={16} />
                Logout
              </Link>
            ) : (
              <Link className="rounded-full bg-white px-4 py-2 text-sm font-bold hover:bg-blush" href="/login">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/95 px-4 py-2 shadow-soft md:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
          <Link className="grid place-items-center gap-1 rounded-2xl p-2 text-xs font-bold" href="/">
            <Home size={20} />
            Home
          </Link>
          <Link className="grid place-items-center gap-1 rounded-2xl bg-coral text-white p-2 text-xs font-bold" href="/dashboard">
            <Gift size={20} />
            Gifts
          </Link>
          <Link className="grid place-items-center gap-1 rounded-2xl p-2 text-xs font-bold" href="/profiles">
            <UserRound size={20} />
            People
          </Link>
        </div>
      </nav>
    </div>
  );
}
