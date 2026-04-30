import { NextResponse } from "next/server";
import { getPublicProfile } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const publicProfile = await getPublicProfile(params.slug);
  if (!publicProfile) return NextResponse.json({ message: "Profile not found" }, { status: 404 });
  return NextResponse.json(publicProfile);
}
