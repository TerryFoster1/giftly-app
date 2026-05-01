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
  return email.trim().toLowerCase();
}

export async function createUserSession(userId: string) {
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

  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDays * 24 * 60 * 60,
    expires: expiresAt
  });
}

export async function clearUserSession() {
  const token = cookies().get(sessionCookieName)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookies().set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser() {
  const token = cookies().get(sessionCookieName)?.value;
  if (!token) {
    console.warn("[auth] Session lookup failed", { reason: "missing_cookie" });
    return null;
  }

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    console.warn("[auth] Session lookup failed", {
      reason: session ? "expired_session" : "missing_session",
      hasCookie: true
    });
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    createdAt: session.user.createdAt.toISOString(),
    updatedAt: session.user.updatedAt.toISOString()
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
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
        passwordHash: hashPassword(input.password)
      }
    });

    const slug = `${baseSlug}-${createdUser.id.slice(-6).toLowerCase()}`;
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
        isPrimary: true,
        isManagedProfile: false
      }
    });

    return createdUser;
  });

  await createUserSession(user.id);
  return user;
}

export async function signInWithPassword(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(input.email) } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) throw new Error("INVALID_CREDENTIALS");

  await createUserSession(user.id);
  return user;
}

export function isAuthError(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHENTICATED";
}
