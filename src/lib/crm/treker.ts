/** Клиент моста к Lyalin Treker (переписки Telegram). Только сервер-сервер, секрет не уходит в браузер. */
export async function trekerFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = process.env.TREKER_URL;
  const secret = process.env.TREKER_SECRET;
  if (!url || !secret) {
    return new Response(JSON.stringify({ error: "Мост к Treker не настроен (TREKER_URL / TREKER_SECRET)" }), { status: 503 });
  }
  return fetch(`${url}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Bot-Secret": secret, ...(init?.headers || {}) },
    cache: "no-store",
  });
}

export async function relay(res: Response): Promise<Response> {
  return new Response(await res.text(), { status: res.status, headers: { "Content-Type": "application/json" } });
}
