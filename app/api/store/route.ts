import { NextResponse } from "next/server";
import { getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET() {
  return withUser((user) => getOwnerStore(user));
}
