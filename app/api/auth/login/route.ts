import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export async function POST(request: Request) {
  try {
    const body = await readAuthBody(request);
    const { session } = await signInWithPassword(body);
    const response = wantsJson(request)
      ? NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
      : NextResponse.redirect(new URL("/dashboard", request.url), 303);
    response.cookies.set(session.name, session.value, session.options);
    console.info("[auth-debug] Setting session cookie", {
      route: "login",
      name: session.name,
      path: session.options.path,
      secure: session.options.secure,
      sameSite: session.options.sameSite,
      responseType: wantsJson(request) ? "json" : "redirect"
    });
    return response;
  } catch {
    if (wantsJson(request)) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    return NextResponse.redirect(loginUrl, 303);
  }
}
