import { NextResponse } from "next/server";
import { describeSessionCookie, serializeSessionCookie, signInWithPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readAuthBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return request.json();

  const formData = await request.formData();
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };
}

function wantsJson(request: Request) {
  return (request.headers.get("content-type") ?? "").includes("application/json");
}

function redirectWithSessionCookie(url: URL, cookie: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: url.toString(),
      "Set-Cookie": cookie,
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  try {
    const body = await readAuthBody(request);
    const { session } = await signInWithPassword(body);
    const cookie = serializeSessionCookie(session);
    const response = wantsJson(request)
      ? NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "Set-Cookie": cookie } })
      : redirectWithSessionCookie(new URL("/dashboard", request.url), cookie);
    console.info("[auth-debug] Setting session cookie", {
      route: "login",
      runtime: process.env.NEXT_RUNTIME ?? "nodejs",
      responseType: wantsJson(request) ? "json" : "redirect",
      status: response.status,
      hasSetCookieHeader: response.headers.has("set-cookie"),
      responseHeaderNames: Array.from(response.headers.keys()),
      cookie: describeSessionCookie(session)
    });
    return response;
  } catch {
    if (wantsJson(request)) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    return new Response(null, {
      status: 303,
      headers: {
        Location: loginUrl.toString(),
        "Cache-Control": "no-store"
      }
    });
  }
}
