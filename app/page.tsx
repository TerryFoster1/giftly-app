import Link from "next/link";
import { ArrowRight, Heart, QrCode, UsersRound } from "lucide-react";
import { AppShell } from "@/components/shell";

const features = [
  ["Save all year", "Paste or enter ideas when they pop up, then sort them by occasion and want level."],
  ["Share by QR", "Every profile gets a public wishlist link and QR card for friends and family."],
  ["Plan for family", "Manage profiles for kids, partners, parents, or anyone you buy for."],
  ["Keep surprises", "Private and hidden ideas stay out of the public wishlist view."]
];

export default function LandingPage() {
  return (
    <AppShell>
      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-mint px-3 py-2 text-sm font-black text-spruce">
              <Heart size={16} />
              Universal wishlists for real life
            </div>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[1.02] tracking-normal text-ink md:text-7xl">
              Giftly
            </h1>
            <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-ink/70">
              Save gift ideas all year, organize family wishlists, share a QR code, and keep private surprise ideas where they belong.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-coral px-5 text-sm font-black text-white shadow-soft hover:bg-berry" href="/dashboard">
                Start Your Wishlist
                <ArrowRight size={18} />
              </Link>
              <Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-ink shadow-sm ring-1 ring-ink/10 hover:bg-blush" href="/profiles">
                <UsersRound size={18} />
                Create Family Profile
              </Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-ink/10 bg-white p-4 shadow-soft">
            <div className="rounded-[1.5rem] bg-blush p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-berry">Kathryn's Wishlist</p>
                  <p className="text-xs font-bold text-ink/50">giftly.app/u/kathryn</p>
                </div>
                <QrCode className="text-spruce" />
              </div>
              <div className="mt-5 grid gap-3">
                {["Ceramic travel mug", "Weekend tote", "Cooking class"].map((item, index) => (
                  <div className="rounded-2xl bg-white p-4 shadow-sm" key={item}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black">{item}</p>
                        <p className="text-sm font-bold text-ink/50">{index === 0 ? "Reserved" : "Available"}</p>
                      </div>
                      <span className="rounded-full bg-honey/30 px-3 py-1 text-xs font-black text-ink">{"♥".repeat(5 - index)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-3 px-4 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, body]) => (
            <article className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm" key={title}>
              <h2 className="font-black">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/65">{body}</p>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
