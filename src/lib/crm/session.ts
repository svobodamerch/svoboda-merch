/**
 * Подписанная cookie-сессия для /admin — без обращения к БД.
 *
 * middleware.ts работает в Edge-рантайме, где нативный better-sqlite3
 * недоступен, поэтому сессию нельзя хранить как строку в таблице и
 * проверять там же. Вместо этого cookie сама несёт полезную нагрузку
 * (userId, срок) и подпись HMAC-SHA256 через Web Crypto — он есть и
 * в Node, и в Edge, так что этот файл безопасно импортировать из
 * middleware.
 */

export const SESSION_COOKIE = "crm_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

function getSecret(): string {
  const secret = process.env.CRM_SESSION_SECRET;
  if (!secret) {
    throw new Error("CRM_SESSION_SECRET не задан");
  }
  return secret;
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(signature).toString("base64url");
}

export async function signSession(userId: number, name: string): Promise<string> {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expires}.${encodeURIComponent(name)}`;
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

export type SessionData = { userId: number; name: string; expires: number };

export async function verifySession(token: string | undefined): Promise<SessionData | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userIdRaw, expiresRaw, nameRaw, signature] = parts;
  const payload = `${userIdRaw}.${expiresRaw}.${nameRaw}`;

  const expected = await hmac(payload);
  if (expected !== signature) return null;

  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Date.now()) return null;

  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId)) return null;

  return { userId, name: decodeURIComponent(nameRaw), expires };
}
