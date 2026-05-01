import { NextResponse } from "next/server";
import { extractUrlMetadata } from "@/lib/metadata";
import { normalizeProductUrl } from "@/lib/product-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "Enter a valid product link." }, { status: 400 });
    }

    const normalized = normalizeProductUrl(body.url);
    if (normalized.error || !normalized.url) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const metadata = await extractUrlMetadata(normalized.url);
    return NextResponse.json(metadata);
  } catch {
    return NextResponse.json({
      error: "We couldn't pull details from this site. You can still add it manually."
    });
  }
}
