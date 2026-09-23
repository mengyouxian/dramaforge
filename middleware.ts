import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, SESSION_COOKIE } from "@/lib/cookies";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url);
  }

  if (pathname === "/app" || pathname.startsWith("/app/")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      const locale = req.cookies.get(LOCALE_COOKIE)?.value === "zh" ? "zh" : "en";
      url.pathname = `/${locale}/login`;
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }

  const locale = pathname === "/zh" || pathname.startsWith("/zh/") ? "zh" : pathname === "/en" || pathname.startsWith("/en/") ? "en" : null;
  const res = NextResponse.next();
  if (locale) {
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  matcher: ["/", "/app/:path*", "/zh", "/zh/:path*", "/en", "/en/:path*"],
};
