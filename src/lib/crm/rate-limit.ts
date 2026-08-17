/**
 * Ограничение попыток входа. fail2ban на сервере прикрывает SSH, но не
 * веб-форму — по /api/crm/auth/login можно было перебирать пароль сколько
 * угодно. Счётчик в памяти процесса: сайт работает одним инстансом pm2,
 * так что общего хранилища не нужно. При перезапуске счётчики сбрасываются —
 * приемлемо, окно блокировки всё равно минуты.
 */

type Bucket = { fails: number; firstFailAt: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;
const BLOCK_MS = 15 * 60 * 1000;
/** Чтобы Map не рос бесконечно от случайных IP */
const MAX_BUCKETS = 5000;

export type RateLimitVerdict = { allowed: true } | { allowed: false; retryAfterSec: number };

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    if (b.blockedUntil < now && now - b.firstFailAt > WINDOW_MS) buckets.delete(key);
  }
}

export function checkLoginAllowed(key: string): RateLimitVerdict {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b) return { allowed: true };

  if (b.blockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  // Окно истекло — начинаем счёт заново
  if (now - b.firstFailAt > WINDOW_MS) {
    buckets.delete(key);
  }
  return { allowed: true };
}

export function registerLoginFailure(key: string): void {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || now - b.firstFailAt > WINDOW_MS) {
    buckets.set(key, { fails: 1, firstFailAt: now, blockedUntil: 0 });
    return;
  }

  b.fails += 1;
  if (b.fails >= MAX_FAILS) {
    b.blockedUntil = now + BLOCK_MS;
    b.fails = 0;
    b.firstFailAt = now;
  }
}

export function resetLoginFailures(key: string): void {
  buckets.delete(key);
}

/** IP клиента за обратным прокси nginx */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
