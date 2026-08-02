import { NextRequest, NextResponse } from "next/server";

// Страницы, которые временно отключены — редиректим на главную
const DISABLED_PATHS = [
  "/catalog",
  "/production",
  "/process",
  "/cases",
  "/blog",
  "/business",
  "/community",
  "/faq",
  "/about",
  "/admin",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // qr.svoboda.site — отдельный домен на этом же процессе,
  // главная страница подменяется на /qr без изменения URL в адресной строке
  if (pathname === "/" && request.headers.get("host")?.startsWith("qr.")) {
    return NextResponse.rewrite(new URL("/qr", request.url));
  }

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
    "/",
    "/catalog/:path*",
    "/production/:path*",
    "/process/:path*",
    "/cases/:path*",
    "/blog/:path*",
    "/business/:path*",
    "/community/:path*",
    "/faq/:path*",
    "/about/:path*",
    "/admin/:path*",
  ],
};
