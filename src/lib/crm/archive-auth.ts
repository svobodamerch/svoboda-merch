import { NextRequest } from "next/server";
import { getCurrentActor } from "./current-user";

/**
 * Ключ ассистента (Claude) для архива. Middleware пускает с ним только
 * /api/crm/archive/* и без DELETE — остальную CRM этот ключ не открывает.
 */
export function hasArchiveKey(request: NextRequest): boolean {
  const key = process.env.ARCHIVE_API_KEY;
  return !!key && request.headers.get("x-archive-key") === key;
}

export async function archiveActor(request: NextRequest): Promise<string> {
  return hasArchiveKey(request) ? "claude" : getCurrentActor();
}
