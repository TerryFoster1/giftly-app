import { BarChart3, Link2, PackagePlus, SearchCheck, ShoppingBag } from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { getCurrentUser } from "@/lib/auth";

const adminCards = [
  {
    title: "Recommended products",
    description: "Add curated gift ideas that can appear in discovery surfaces later.",
    icon: PackagePlus
  },
  {
    title: "Affiliate links",
    description: "Prepare product links, program notes, and future merchant matching.",
    icon: Link2
  },
  {
    title: "Unmatched products",
    description: "Review saved products that do not have an affiliate match yet.",
    icon: SearchCheck
  },
  {
    title: "Buying signals",
    description: "Track product saves, buy clicks, reservations, and popular gift categories.",
    icon: BarChart3
  },
  {
    title: "Buy-for-others",
    description: "Plan future workflows for gift givers without exposing surprises to wishlist owners.",
    icon: ShoppingBag
  }
];

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell>
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6">
        <section className="rounded-[2rem] border border-ink/10 bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase text-berry">Admin foundation</p>
          <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">Gift discovery operations</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-ink/60">
            A protected starting point for managing recommended products, affiliate program notes, and gift-planning analytics.
          </p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminCards.map(({ title, description, icon: Icon }) => (
            <article className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-white p-4 shadow-sm" key={title}>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blush text-berry">
                <Icon size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black">{title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-ink/60">{description}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
