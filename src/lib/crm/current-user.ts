import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/crm/session";

/** Кто сейчас в сессии — для API routes (Node-рантайм). Middleware уже проверил, что сессия валидна. */
export async function getCurrentActor(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  return session ? `site:${session.name}` : "site:unknown";
}
