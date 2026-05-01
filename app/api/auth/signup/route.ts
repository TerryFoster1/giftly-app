import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { signUpWithPassword } from "@/lib/auth";

function logSignupFailure(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[signup] Prisma known request error", {
      code: error.code,
      message: error.message,
      meta: error.meta
    });
    return;
  }

  if (error instanceof Error) {
    console.error("[signup] Signup failure", {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    return;
  }

  console.error("[signup] Unknown signup failure", { error });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await signUpWithPassword(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    logSignupFailure(error);

    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return NextResponse.json({ message: "Use a valid email and a password of at least 8 characters." }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "That email may already be in use." }, { status: 409 });
    }

    if (error instanceof Error && ["DATABASE_URL_REQUIRED", "VERCEL_REQUIRES_POSTGRES_DATABASE_URL", "AUTH_SECRET_REQUIRED"].includes(error.message)) {
      return NextResponse.json({ message: "Signup is temporarily unavailable while the server is being configured." }, { status: 500 });
    }

    return NextResponse.json({ message: "Signup is temporarily unavailable. Please try again soon." }, { status: 500 });
  }
}
