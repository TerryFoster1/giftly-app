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

async function readSignupInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      name: typeof body?.name === "string" ? body.name : "",
      email: typeof body?.email === "string" ? body.email : "",
      password: typeof body?.password === "string" ? body.password : ""
    };
  }
  const formData = await request.formData();
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };
}

function signupErrorRedirect(request: Request, code: string) {
  const url = new URL("/signup", request.url);
  url.searchParams.set("error", code);
  const response = NextResponse.redirect(url, { status: 303 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  try {
    const input = await readSignupInput(request);
    const { session } = await signUpWithPassword(input);
    const response = NextResponse.redirect(new URL("/profiles", request.url), { status: 303 });
    response.cookies.set(session.name, session.value, session.options);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    logSignupFailure(error);

    if (error instanceof Error && error.message === "INVALID_AUTH_INPUT") {
      return signupErrorRedirect(request, "weak");
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return signupErrorRedirect(request, "taken");
    }

    if (error instanceof Error && ["DATABASE_URL_REQUIRED", "VERCEL_REQUIRES_POSTGRES_DATABASE_URL", "AUTH_SECRET_REQUIRED"].includes(error.message)) {
      return signupErrorRedirect(request, "config");
    }

    return signupErrorRedirect(request, "other");
  }
}
