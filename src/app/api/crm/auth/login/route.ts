import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/crm/auth";
import { getUserByUsername } from "@/lib/crm/db";
import { SESSION_COOKIE, signSession } from "@/lib/crm/session";
import {
  checkLoginAllowed,
  clientKey,
  registerLoginFailure,
  resetLoginFailures,
} from "@/lib/crm/rate-limit";

/**
 * Заглушка того же вида, что и реальный хеш: для несуществующего логина
 * всё равно считаем scrypt, иначе по времени ответа видно, какие логины
 * заведены в системе.
 */
const DUMMY_HASH =
  "0000000000000000000000000000000000000000000000000000000000000000:" +
  "0".repeat(128);

export async function POST(request: NextRequest) {
  const key = clientKey(request.headers);

  const verdict = checkLoginAllowed(key);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: `Слишком много попыток. Попробуйте через ${Math.ceil(verdict.retryAfterSec / 60)} мин.` },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } },
    );
  }

  const body = await request.json();
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  const user = getUserByUsername(username);
  const ok = verifyPassword(password, user ? user.password_hash : DUMMY_HASH) && !!user;

  if (!ok || !user) {
    registerLoginFailure(key);
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  resetLoginFailures(key);

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
