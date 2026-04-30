import { NextResponse, type NextRequest } from "next/server";

const sessionCookieName = "giftly_session";
const privatePaths = ["/dashboard", "/profiles"];

export function middleware(request: NextRequest) {
  const isPrivatePath = privatePaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (!isPrivatePath) return NextResponse.next();

  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);
  if (hasSessionCookie) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/profiles/:path*"]
};
