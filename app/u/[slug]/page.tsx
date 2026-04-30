import { PublicProfileClient } from "@/components/public-profile-client";

export default function PublicProfilePage({ params }: { params: { slug: string } }) {
  return <PublicProfileClient slug={params.slug} />;
}
