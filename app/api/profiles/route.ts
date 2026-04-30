import { NextResponse } from "next/server";
import { createManagedProfile, getOwnerStore } from "@/lib/db";
import { withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => {
    const store = await getOwnerStore(user);
    return store.profiles;
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return withUser((user) => createManagedProfile(user, body));
}
