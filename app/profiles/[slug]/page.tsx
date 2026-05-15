import { AppShell } from "@/components/shell";
import { WishlistDetailClient } from "@/components/wishlist-detail-client";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfileDetailPage({ params }: { params: { slug: string } }) {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <AppShell>
      <WishlistDetailClient slug={params.slug} />
    </AppShell>
  );
}
