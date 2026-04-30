import { NextResponse } from "next/server";
import { isAuthError, requireCurrentUser } from "./auth";

export async function withUser<T>(handler: (user: Awaited<ReturnType<typeof requireCurrentUser>>) => Promise<T>) {
  try {
    const user = await requireCurrentUser();
    return NextResponse.json(await handler(user));
  } catch (error) {
    if (isAuthError(error)) return NextResponse.json({ message: "Login required" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ message: "Not allowed" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return NextResponse.json({ message: "Check your email and use a password of at least 8 characters." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }
    if (error instanceof Error && error.message === "INVALID_SLUG") {
      return NextResponse.json({ message: "Use only lowercase letters, numbers, and hyphens for the vanity URL." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return NextResponse.json({ message: "That vanity URL is already taken." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "AUTH_SECRET_REQUIRED") {
      return NextResponse.json({ message: "Server auth secret is not configured." }, { status: 500 });
    }
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
