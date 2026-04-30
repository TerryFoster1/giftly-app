import { lookup } from "dns/promises";
import { isIP } from "net";

export type UrlMetadata = {
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  storeName?: string;
  price?: string;
  currency?: string;
  canonicalUrl?: string;
  error?: string;
};

const MAX_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 7000;
const MAX_REDIRECTS = 3;

function decodeHtml(value?: string | null) {
  if (!value) return undefined;
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim() || undefined;
}

function absolutizeUrl(value: string | undefined, baseUrl: string) {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function isPrivateIp(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  if (!isIP(address)) return true;

  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;

  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 ||
    a === 192 && b === 168
  );
}

async function assertPublicHttpUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("INVALID_URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) throw new Error("INVALID_URL");
  const hostname = url.hostname.toLowerCase();
  if (["localhost", "0.0.0.0"].includes(hostname) || hostname.endsWith(".local")) throw new Error("INVALID_URL");
  if (isIP(hostname) && isPrivateIp(hostname)) throw new Error("INVALID_URL");

  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) throw new Error("INVALID_URL");

  return url;
}

function getAttribute(tag: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return decodeHtml(tag.match(pattern)?.[1]);
}

function getMeta(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const property = getAttribute(tag, "property");
    const name = getAttribute(tag, "name");
    if (property?.toLowerCase() === key.toLowerCase() || name?.toLowerCase() === key.toLowerCase()) {
      return getAttribute(tag, "content");
    }
  }
  return undefined;
}

function getTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
}

function getCanonical(html: string, baseUrl: string) {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const link of links) {
    const rel = getAttribute(link, "rel");
    if (rel?.toLowerCase().split(/\s+/).includes("canonical")) {
      return absolutizeUrl(getAttribute(link, "href"), baseUrl);
    }
  }
  return undefined;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function findProductSchema(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  const types = toArray(object["@type"] as string | string[] | undefined).map((type) => type.toLowerCase());
  if (types.includes("product")) return object;

  for (const child of Object.values(object)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const result = findProductSchema(item);
        if (result) return result;
      }
    } else {
      const result = findProductSchema(child);
      if (result) return result;
    }
  }
  return undefined;
}

function stringFromSchema(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return stringFromSchema(value[0]);
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.url === "string") return object.url;
    if (typeof object.name === "string") return object.name;
  }
  return undefined;
}

function parseJsonLd(html: string) {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const script of scripts) {
    const raw = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const parsed = JSON.parse(raw);
      const product = findProductSchema(parsed);
      if (!product) continue;

      const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
      const offer = offers && typeof offers === "object" ? offers as Record<string, unknown> : {};
      return {
        title: stringFromSchema(product.name),
        imageUrl: stringFromSchema(product.image),
        price: typeof offer.price === "number" ? String(offer.price) : stringFromSchema(offer.price),
        currency: stringFromSchema(offer.priceCurrency),
        siteName: stringFromSchema(product.brand) || stringFromSchema(offer.seller)
      };
    } catch {
      continue;
    }
  }
  return {};
}

function deriveStoreName(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  const first = host.split(".")[0];
  const known: Record<string, string> = {
    amazon: "Amazon",
    etsy: "Etsy",
    target: "Target",
    walmart: "Walmart",
    shopify: "Shopify"
  };
  return known[first] ?? first.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function fetchHtml(url: URL, redirects = 0): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": "GiftlyBot/0.1 (+https://giftly.local)"
      },
      redirect: "manual",
      signal: controller.signal
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      if (redirects >= MAX_REDIRECTS) throw new Error("TOO_MANY_REDIRECTS");
      const location = response.headers.get("location");
      if (!location) throw new Error("FETCH_FAILED");
      const nextUrl = await assertPublicHttpUrl(new URL(location, url).toString());
      return fetchHtml(nextUrl, redirects + 1);
    }

    if (!response.ok) throw new Error("FETCH_FAILED");
    const reader = response.body?.getReader();
    if (!reader) throw new Error("FETCH_FAILED");

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BYTES) break;
      chunks.push(value);
    }

    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { html, finalUrl: response.url || url.toString() };
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractUrlMetadata(inputUrl: string): Promise<UrlMetadata> {
  try {
    const startingUrl = await assertPublicHttpUrl(inputUrl);
    const { html, finalUrl } = await fetchHtml(startingUrl);
    const schema = parseJsonLd(html);
    const finalParsedUrl = new URL(finalUrl);
    const canonicalUrl = getCanonical(html, finalUrl) || absolutizeUrl(getMeta(html, "og:url"), finalUrl) || finalUrl;
    const siteName = getMeta(html, "og:site_name") || schema.siteName || deriveStoreName(finalParsedUrl);

    return {
      title: schema.title || getMeta(html, "og:title") || getMeta(html, "twitter:title") || getTitle(html),
      description: getMeta(html, "og:description") || getMeta(html, "twitter:description") || getMeta(html, "description"),
      imageUrl: absolutizeUrl(schema.imageUrl || getMeta(html, "og:image") || getMeta(html, "twitter:image"), finalUrl),
      siteName,
      storeName: siteName,
      price: schema.price || getMeta(html, "product:price:amount") || getMeta(html, "og:price:amount"),
      currency: schema.currency || getMeta(html, "product:price:currency") || getMeta(html, "og:price:currency"),
      canonicalUrl
    };
  } catch {
    try {
      const parsed = new URL(inputUrl);
      return {
        storeName: deriveStoreName(parsed),
        canonicalUrl: inputUrl,
        error: "We couldn't pull details from this site. You can still add it manually."
      };
    } catch {
      return { error: "Enter a valid http or https product link." };
    }
  }
}
