import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getRequestCookieNames, isAuthError, requireCurrentUser } from "./auth";

function json<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

type ApiLogOptions = {
  logLabel?: string;
  request?: Request;
};

function logApiError(label: string, error: unknown) {
  if (isAuthError(error)) {
    console.warn(`[${label}] Missing authenticated session`);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[${label}] Prisma request error`, {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`[${label}] Request error`, {
      name: error.name,
      message: error.message
    });
    return;
  }

  console.error(`[${label}] Unknown request error`, { error });
}

export async function withUser<T>(
  handler: (user: Awaited<ReturnType<typeof requireCurrentUser>>) => Promise<T>,
  options: ApiLogOptions = {}
) {
  const logLabel = options.logLabel ?? "api";
  try {
    if (options.request) {
      const requestUrl = new URL(options.request.url);
      console.info("[auth-debug] API request context", {
        label: logLabel,
        method: options.request.method,
        requestOrigin: requestUrl.origin,
        requestPath: requestUrl.pathname,
        cookieNames: getRequestCookieNames(options.request)
      });
    }

    const user = await requireCurrentUser(options.request);
    return json(await handler(user));
  } catch (error) {
    logApiError(logLabel, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2022") {
        return json({ message: "Giftly needs the latest database migration before this can be saved." }, 500);
      }
    }

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
    if (error instanceof Error && error.message === "CANNOT_DELETE_SELF") {
      return json({ message: "You cannot delete your own admin account." }, 400);
    }
    if (error instanceof Error && error.message === "AFFILIATE_TAG_REQUIRED") {
      return json({ message: "Add an active Amazon tracking tag before scanning products." }, 400);
    }
    if (error instanceof Error && error.message === "GIFT_UNAVAILABLE") {
      return json({ message: "This gift is already reserved or purchased." }, 409);
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
