import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { describeSessionCookie, serializeSessionCookie, signUpWithPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readAuthBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return request.json();

  const formData = await request.formData();
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };
}

function wantsJson(request: Request) {
  return (request.headers.get("content-type") ?? "").includes("application/json");
}

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
    const body = await readAuthBody(request);
    const { session } = await signUpWithPassword(body);
    const response = wantsJson(request)
      ? NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } })
      : NextResponse.redirect(new URL("/profiles", request.url), 303);
    response.headers.append("Set-Cookie", serializeSessionCookie(session));
    console.info("[auth-debug] Setting session cookie", {
      route: "signup",
      runtime: process.env.NEXT_RUNTIME ?? "nodejs",
      responseType: wantsJson(request) ? "json" : "redirect",
      status: response.status,
      hasSetCookieHeader: response.headers.has("set-cookie"),
      responseHeaderNames: Array.from(response.headers.keys()),
      cookie: describeSessionCookie(session)
    });
    return response;
  } catch (error) {
    logSignupFailure(error);

    if (!wantsJson(request)) {
      const signupUrl = new URL("/signup", request.url);
      signupUrl.searchParams.set("error", "signup");
      return NextResponse.redirect(signupUrl, 303);
    }

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
