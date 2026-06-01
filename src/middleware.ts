import { NextRequest, NextResponse } from "next/server";

// Страницы, которые временно отключены — редиректим на главную
const DISABLED_PATHS = [
  "/catalog",
  "/production",
  "/process",
  "/cases",
  "/blog",
  "/shop",
  "/business",
  "/community",
  "/faq",
  "/about",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Редирект отключённых страниц на главную
  const isDisabled = DISABLED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (isDisabled) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/catalog/:path*",
    "/production/:path*",
    "/process/:path*",
    "/cases/:path*",
    "/blog/:path*",
    "/shop/:path*",
    "/business/:path*",
    "/community/:path*",
    "/faq/:path*",
    "/about/:path*",
    "/admin/:path*",
  ],
};
