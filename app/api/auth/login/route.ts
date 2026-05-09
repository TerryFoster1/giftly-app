import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await signInWithPassword(body);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }
}
