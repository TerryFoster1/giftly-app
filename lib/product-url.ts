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
    const hostname = new URL(input).hostname.toLowerCase();
    return /(^|\.)amazon\.(com|ca|co\.uk|de|fr|it|es|co\.jp|com\.au|com\.br|com\.mx|nl|se|pl|sg|ae|sa|in|com\.tr|eg|cn)$/i.test(hostname);
  } catch {
    return false;
  }
}

function extractAmazonAsin(url: URL) {
  const pathMatch = url.pathname.match(/\/(?:[^/]+\/)?(?:dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

  const queryAsin = url.searchParams.get("asin") || url.searchParams.get("ASIN");
  if (queryAsin && /^[A-Z0-9]{10}$/i.test(queryAsin)) return queryAsin.toUpperCase();

  return "";
}

export function normalizeAmazonProductUrl(input: string) {
  const normalized = normalizeProductUrl(input);
  if (normalized.error || !normalized.url || !isAmazonUrl(normalized.url)) return normalized;

  try {
    const url = new URL(normalized.url);
    const asin = extractAmazonAsin(url);
    if (asin) {
      url.pathname = `/dp/${asin}`;
    }

    for (const key of Array.from(url.searchParams.keys())) {
      if (key !== "tag") url.searchParams.delete(key);
    }

    url.hash = "";
    return { url: url.toString() };
  } catch {
    return normalized;
  }
}
