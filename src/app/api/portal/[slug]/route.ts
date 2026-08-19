import { NextRequest, NextResponse } from "next/server";
import { checkPortalPassword, getContractorByPortalSlug, getContractorPortalData } from "@/lib/crm/db";
import { checkLoginAllowed, clientKey, registerLoginFailure, resetLoginFailures } from "@/lib/crm/rate-limit";

/**
 * Публичный роут — вне /api/crm, поэтому middleware его не гейтит сессией.
 * Вместо логина — пароль (номер телефона подрядчика без 8) на каждый заход,
 * без долгоживущей сессии: подрядчик открывает раз в несколько дней, не стоит
 * усложнять постоянным токеном на телефоне, который может быть общим.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const contractor = getContractorByPortalSlug(slug);
  if (!contractor) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  const key = `portal:${slug}:${clientKey(request.headers)}`;
  const verdict = checkLoginAllowed(key);
  if (!verdict.allowed) {
    return NextResponse.json(
      { error: `Слишком много попыток. Попробуйте через ${Math.ceil(verdict.retryAfterSec / 60)} мин.` },
      { status: 429, headers: { "Retry-After": String(verdict.retryAfterSec) } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = String(body.password || "");

  if (!checkPortalPassword(contractor, password)) {
    registerLoginFailure(key);
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  resetLoginFailures(key);
  return NextResponse.json(getContractorPortalData(contractor.id));
}
