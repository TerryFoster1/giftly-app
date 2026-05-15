import { cookies } from "next/headers";
import { createHmac, randomBytes, randomUUID } from "crypto";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";

export const sessionCookieName = "giftly_session";
const sessionDays = 30;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET_REQUIRED");
  return secret || "giftly-local-development-secret";
}

function hashToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(token).digest("hex");
}

function normalizeEmail(email: string) {
  return email.trim().replace(/^["']|["']$/g, "").toLowerCase();
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "wishlist"
  );
}

function isConfiguredAdminEmail(email: string) {
  return [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL, process.env.GIFTLY_ADMIN_EMAILS]
    .filter(Boolean)
    .join(",")
    .split(/[\s,;]+/)
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
    .includes(normalizeEmail(email));
}

export function userHasAdminAccess(user: { email: string; isAdmin?: boolean | null } | null | undefined) {
  if (!user) return false;
  return Boolean(user.isAdmin || isConfiguredAdminEmail(user.email));
}

function parseCookieHeader(header: string | null) {
  const values = new Map<string, string>();
  if (!header) return values;

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName) continue;
    const value = rawValue.join("=");
    try {
      values.set(rawName, decodeURIComponent(value));
    } catch {
      values.set(rawName, value);
    }
  }

  return values;
}

function getRequestCookie(request: Request | undefined, name: string) {
  if (!request) return undefined;
  return parseCookieHeader(request.headers.get("cookie")).get(name);
}

export function getRequestCookieNames(request?: Request) {
  const requestCookieNames = Array.from(parseCookieHeader(request?.headers.get("cookie") ?? null).keys());
  const nextCookieNames = cookies()
    .getAll()
    .map((cookie) => cookie.name);

  return Array.from(new Set([...nextCookieNames, ...requestCookieNames])).sort();
}

export type SessionCookieAttachment = {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
    expires: Date;
  };
};

export type SessionCookieClear = {
  name: string;
  value: "";
  options: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: 0;
  };
};

export function serializeSessionCookie(cookie: SessionCookieAttachment | SessionCookieClear) {
  const sameSite = cookie.options.sameSite === "lax" ? "Lax" : cookie.options.sameSite;
  const parts = [
    `${cookie.name}=${encodeURIComponent(cookie.value)}`,
    `Path=${cookie.options.path}`,
    `Max-Age=${cookie.options.maxAge}`,
    `SameSite=${sameSite}`,
    "HttpOnly"
  ];

  if ("expires" in cookie.options) parts.push(`Expires=${cookie.options.expires.toUTCString()}`);
  if (cookie.options.secure) parts.push("Secure");

  return parts.join("; ");
}

export function describeSessionCookie(cookie: SessionCookieAttachment | SessionCookieClear) {
  return {
    name: cookie.name,
    path: cookie.options.path,
    maxAge: cookie.options.maxAge,
    sameSite: cookie.options.sameSite,
    secure: cookie.options.secure,
    httpOnly: cookie.options.httpOnly,
    hasExpires: "expires" in cookie.options
  };
}

export async function createUserSession(userId: string): Promise<SessionCookieAttachment> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: `session_${randomUUID()}`,
      userId,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  return {
    name: sessionCookieName,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionDays * 24 * 60 * 60,
      expires: expiresAt
    }
  };
}

export async function clearUserSession(): Promise<SessionCookieClear> {
  const token = cookies().get(sessionCookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  return {
    name: sessionCookieName,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    }
  };
}

export async function getCurrentUser(request?: Request) {
  const token = cookies().get(sessionCookieName)?.value ?? getRequestCookie(request, sessionCookieName);
  const cookieNames = getRequestCookieNames(request);
  if (!token) {
    console.warn("[auth-debug] Session lookup failed", {
      reason: "missing_cookie",
      cookieNames
    });
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    console.warn("[auth-debug] Session lookup failed", {
      reason: session ? "expired_session" : "missing_session",
      hasSessionCookie: true,
      cookieNames
    });
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  console.info("[auth-debug] Session lookup succeeded", {
    result: "authenticated",
    userId: session.user.id,
    cookieNames
  });

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isAdmin: session.user.isAdmin || isConfiguredAdminEmail(session.user.email),
    onboardingCompleted: session.user.onboardingCompleted,
    createdAt: session.user.createdAt.toISOString(),
    updatedAt: session.user.updatedAt.toISOString()
  };
}

export async function requireCurrentUser(request?: Request) {
  const user = await getCurrentUser(request);
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function signUpWithPassword(input: { name: string; email: string; password: string }) {
  const email = normalizeEmail(input.email);
  if (!email || input.password.length < 8) throw new Error("INVALID_AUTH_INPUT");
  const name = input.name.trim() || email;
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || email.split("@")[0].replace(/[^a-z0-9]+/g, "-");

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        id: `user_${randomUUID()}`,
        email,
        name,
        passwordHash: hashPassword(input.password),
        onboardingCompleted: false
      }
    });

    const suffix = createdUser.id.slice(-6).toLowerCase();
    const slug = `${baseSlug}-${suffix}`;
    await tx.profile.create({
      data: {
        id: `profile_${randomUUID()}`,
        ownerUserId: createdUser.id,
        linkedUserId: createdUser.id,
        displayName: name,
        slug,
        relationship: "Me",
        photoUrl: null,
        bio: "",
        listVisibility: "shared",
        isPrimary: true,
        isManagedProfile: false
      }
    });
    await tx.profile.createMany({
      data: [
        {
          id: `profile_${randomUUID()}`,
          ownerUserId: createdUser.id,
          linkedUserId: null,
          displayName: "My Birthday",
          slug: `${slugify(`${name} birthday`)}-${suffix}`,
          relationship: "Wishlist",
          photoUrl: null,
          bio: "A simple place for birthday gift ideas.",
          listVisibility: "shared",
          isPrimary: false,
          isManagedProfile: true
        },
        {
          id: `profile_${randomUUID()}`,
          ownerUserId: createdUser.id,
          linkedUserId: null,
          displayName: "Cool Stuff",
          slug: `${slugify(`${name} cool stuff`)}-${suffix}`,
          relationship: "Wishlist",
          photoUrl: null,
          bio: "Private saves for gift inspiration, someday ideas, and things worth remembering.",
          listVisibility: "private",
          isPrimary: false,
          isManagedProfile: true
        }
      ]
    });

    await tx.giftEvent.create({
      data: {
        id: `event_${randomUUID()}`,
        ownerUserId: createdUser.id,
        title: "Christmas gift planning",
        eventType: "HOLIDAY",
        eventDate: new Date(`${new Date().getFullYear()}-12-25T00:00:00.000Z`),
        groupLabel: "FAMILY",
        notes: "Reminder foundation for holiday gift planning."
      }
    });

    return createdUser;
  });

  const session = await createUserSession(user.id);
  return { user, session };
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) throw new Error("INVALID_CREDENTIALS");

  const session = await createUserSession(user.id);
  return { user, session };
}

export function isAuthError(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHENTICATED";
}
