import { NextRequest } from "next/server";
import { relay, trekerFetch } from "@/lib/crm/treker";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  return relay(await trekerFetch(`/api/crm-link/chats?q=${encodeURIComponent(q)}`));
}
