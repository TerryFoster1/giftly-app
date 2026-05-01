export const fullProductLinkMessage = "Please paste the full product link, starting with https://";

export function normalizeProductUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { error: fullProductLinkMessage };

  let candidate = trimmed;
  if (/^www\./i.test(candidate) || /^[a-z0-9.-]*amazon\.[a-z.]+\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol)) return { error: fullProductLinkMessage };
    if (!url.hostname.includes(".")) return { error: fullProductLinkMessage };
    return { url: url.toString() };
  } catch {
    return { error: fullProductLinkMessage };
  }
}

export function isAmazonUrl(input: string) {
  try {
    return /(^|\.)amazon\./i.test(new URL(input).hostname);
  } catch {
    return false;
  }
}
