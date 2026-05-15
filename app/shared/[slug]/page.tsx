import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { SharedWishlistClient } from "@/components/shared-wishlist-client";
import { getCurrentUser } from "@/lib/auth";

export default async function SharedWishlistPage({ params }: { params: { slug: string } }) {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <SharedWishlistClient slug={params.slug} />
    </AppShell>
  );
}
