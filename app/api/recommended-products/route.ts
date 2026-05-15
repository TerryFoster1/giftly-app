import { NextResponse } from "next/server";
import { listActiveRecommendedProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await listActiveRecommendedProducts();
  return NextResponse.json(products, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
