import { normalizeAmazonProductUrl, isAmazonUrl } from "./product-url";

export type AmazonAffiliateConversion = {
  normalizedOriginalUrl: string;
  affiliateUrl: string;
};

export function createAmazonAffiliateUrl(productUrl: string, trackingTag: string): AmazonAffiliateConversion | null {
  const tag = trackingTag.trim();
  if (!tag || !isAmazonUrl(productUrl)) return null;

  const normalized = normalizeAmazonProductUrl(productUrl);
  if (normalized.error || !normalized.url) return null;

  try {
    const url = new URL(normalized.url);
    url.searchParams.set("tag", tag);

    return {
      normalizedOriginalUrl: normalized.url,
      affiliateUrl: url.toString()
    };
  } catch {
    return null;
  }
}

export function shouldPreserveManualAffiliateUrl(input: {
  affiliateUrl?: string | null;
  affiliateStatus?: string | null;
}) {
  return Boolean(input.affiliateUrl?.trim() && input.affiliateStatus === "manual");
}
