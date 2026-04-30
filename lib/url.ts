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
