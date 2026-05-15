export function publicProfilePath(slug: string) {
  return `/u/${slug}`;
}

export function publicProfileUrl(slug: string) {
  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
    return baseUrl ? `${baseUrl.replace(/\/$/, "")}${publicProfilePath(slug)}` : publicProfilePath(slug);
  }
  return `${window.location.origin}${publicProfilePath(slug)}`;
}

export function bubbleInvitePath(ownerUserId: string, options?: { groupId?: string; wishlistId?: string }) {
  const params = new URLSearchParams();
  if (options?.groupId) params.set("groupId", options.groupId);
  if (options?.wishlistId) params.set("wishlistId", options.wishlistId);
  const query = params.toString();
  return `/invite/${ownerUserId}${query ? `?${query}` : ""}`;
}

export function bubbleInviteUrl(ownerUserId: string, options?: { groupId?: string; wishlistId?: string }) {
  const path = bubbleInvitePath(ownerUserId, options);
  if (typeof window === "undefined") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
    return baseUrl ? `${baseUrl.replace(/\/$/, "")}${path}` : path;
  }
  return `${window.location.origin}${path}`;
}
