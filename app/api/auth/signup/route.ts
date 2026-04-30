import { NextResponse } from "next/server";
import { signUpWithPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await signUpWithPassword(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "INVALID_AUTH_INPUT"
        ? "Use a valid email and a password of at least 8 characters."
        : "That email may already be in use.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
