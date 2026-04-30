import { NextResponse } from "next/server";
import { createContributionPlaceholder, listContributionPlaceholders } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const giftItemId = searchParams.get("giftItemId") ?? undefined;
  return withUser((user) => listContributionPlaceholders(user, giftItemId));
}

export async function POST(request: Request) {
  const body = await request.json();
  return withUser((user) => createContributionPlaceholder(user, body));
}
