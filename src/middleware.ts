import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authHeader = request.headers.get("authorization");
    const expected = "Basic " + btoa("admin:svoboda2024");

    if (authHeader !== expected) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
