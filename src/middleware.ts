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
  const host = request.headers.get("host") || "";

  // qr.svoboda.site — отдельный домен на этом же процессе,
  // главная страница подменяется на /qr без изменения URL в адресной строке
  if (pathname === "/" && host.startsWith("qr.")) {
    return NextResponse.rewrite(new URL("/qr", request.url));
  }

  /*
   * crm.svoboda.site — тот же процесс на другом хосте, без отдельного
   * деплоя. Корень ведёт в дашборд; одиночный сегмент вроде /kustikova —
   * это слаг портала подрядчика (переписываем в /portal/<slug>, портал
   * сам не требует логина — у него свой пароль по телефону). Остальные
   * пути (/admin/crm/..., /api/crm/...) не трогаем — работают как есть.
   */
  let rewriteTo: string | null = null;
  if (host.startsWith("crm.")) {
    if (pathname === "/") {
      rewriteTo = "/admin/crm";
    } else if (/^\/[a-z0-9-]+$/i.test(pathname) && pathname !== "/admin" && pathname !== "/api") {
      rewriteTo = `/portal${pathname}`;
    }
  }
  const effectivePathname = rewriteTo || pathname;

  // /admin/* — раньше был просто заглушкой-редиректом, теперь настоящий логин.
  // /admin/login и /api/crm/auth/* сами себя не защищают.
  const isProtectedPage = effectivePathname.startsWith("/admin") && effectivePathname !== "/admin/login";
  const isProtectedApi =
    effectivePathname.startsWith("/api/crm") && !effectivePathname.startsWith("/api/crm/auth");

  // Сервер-сервер доступ для контрол-центра (crm.lyalin.com.ru): общий секрет
  // в заголовке вместо куки-сессии. Только для чтения /api/crm/* — страницы
  // админки этим каналом не открываются.
  const botSecret = process.env.BOT_API_SECRET;
  const hasBotSecret =
    isProtectedApi &&
    request.method === "GET" &&
    !!botSecret &&
    request.headers.get("x-bot-secret") === botSecret;

  if ((isProtectedPage || isProtectedApi) && !hasBotSecret) {
    const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      if (isProtectedApi) {
        return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", effectivePathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (rewriteTo) {
    return NextResponse.rewrite(new URL(rewriteTo, request.url));
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
    // одиночный сегмент на любом хосте — нужно, чтобы поймать /kustikova
    // на crm.svoboda.site; на основном домене middleware для таких путей
    // просто ничего не делает (host не начинается с crm.)
    "/:slug",
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
