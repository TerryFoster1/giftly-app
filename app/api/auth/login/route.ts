import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session } = await signInWithPassword(body);
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(session.name, session.value, session.options);
    return response;
  } catch {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }
}
