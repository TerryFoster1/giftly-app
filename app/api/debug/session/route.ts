import { NextResponse } from "next/server";
import { getCurrentUser, getRequestCookieNames, sessionCookieName } from "@/lib/auth";

function canUseDiagnostics(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const debugKey = process.env.AUTH_DEBUG_KEY;
  return Boolean(debugKey && request.headers.get("x-giftly-debug-key") === debugKey);
}

export async function GET(request: Request) {
  if (!canUseDiagnostics(request)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const cookieNames = getRequestCookieNames(request);
  const user = await getCurrentUser(request);

  return NextResponse.json(
    {
      hasSessionCookie: cookieNames.includes(sessionCookieName),
      cookieNames,
      authenticated: Boolean(user),
      userId: user?.id ?? null
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
