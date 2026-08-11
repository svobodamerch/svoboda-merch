import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/crm/session";

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
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // qr.svoboda.site — отдельный домен на этом же процессе,
  // главная страница подменяется на /qr без изменения URL в адресной строке
  if (pathname === "/" && request.headers.get("host")?.startsWith("qr.")) {
    return NextResponse.rewrite(new URL("/qr", request.url));
  }

  // /admin/* — раньше был просто заглушкой-редиректом, теперь настоящий логин.
  // /admin/login и /api/crm/auth/* сами себя не защищают.
  const isProtectedPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isProtectedApi =
    pathname.startsWith("/api/crm") && !pathname.startsWith("/api/crm/auth");

  if (isProtectedPage || isProtectedApi) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
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
    "/api/crm/:path*",
  ],
};
