import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/crm/auth";
import { getUserByUsername } from "@/lib/crm/db";
import { SESSION_COOKIE, signSession } from "@/lib/crm/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  const user = getUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const token = await signSession(user.id, user.name);
  const response = NextResponse.json({ ok: true, name: user.name });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
