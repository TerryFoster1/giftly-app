import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/auth";

export async function POST() {
  const cookie = await clearUserSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}

export async function GET(request: Request) {
  const cookie = await clearUserSession();
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
