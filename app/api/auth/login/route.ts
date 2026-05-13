import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/auth";

async function readCredentials(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      email: typeof body?.email === "string" ? body.email : "",
      password: typeof body?.password === "string" ? body.password : ""
    };
  }
  const formData = await request.formData();
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };
}

export async function POST(request: Request) {
  try {
    const { email, password } = await readCredentials(request);
    const { session } = await signInWithPassword({ email, password });
    const response = NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
    response.cookies.set(session.name, session.value, session.options);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "invalid");
    const response = NextResponse.redirect(url, { status: 303 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}
