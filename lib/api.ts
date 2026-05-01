import { NextResponse } from "next/server";
import { isAuthError, requireCurrentUser } from "./auth";

function json<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function withUser<T>(handler: (user: Awaited<ReturnType<typeof requireCurrentUser>>) => Promise<T>) {
  try {
    const user = await requireCurrentUser();
    return json(await handler(user));
  } catch (error) {
    if (isAuthError(error)) return json({ message: "Your session expired. Please log in again." }, 401);
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return json({ message: "Not allowed" }, 403);
    }
    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return json({ message: "Check your email and use a password of at least 8 characters." }, 400);
    }
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return json({ message: "Invalid email or password." }, 401);
    }
    if (error instanceof Error && error.message === "INVALID_SLUG") {
      return json({ message: "Use only lowercase letters, numbers, and hyphens for the vanity URL." }, 400);
    }
    if (error instanceof Error && error.message === "SLUG_TAKEN") {
      return json({ message: "That vanity URL is already taken." }, 409);
    }
    if (error instanceof Error && error.message === "AUTH_SECRET_REQUIRED") {
      return json({ message: "Server auth secret is not configured." }, 500);
    }
    if (error instanceof Error && error.message === "DATABASE_URL_REQUIRED") {
      return json({ message: "Server database URL is not configured." }, 500);
    }
    if (error instanceof Error && error.message === "VERCEL_REQUIRES_POSTGRES_DATABASE_URL") {
      return json({ message: "Vercel requires a hosted Postgres database URL." }, 500);
    }
    return json({ message: "Something went wrong" }, 500);
  }
}
