import { NextRequest, NextResponse } from "next/server";
import {
  ingestMtTransaction,
  suggestForTransaction,
  type IncomingMtTransaction,
} from "@/lib/crm/ingest";
import {
  dismissMtTransaction,
  getExpenseCategories,
  getMtInboxTransaction,
  saveMtInbox,
  getCrmDb,
} from "@/lib/crm/db";

/**
 * Приём бизнес-операций из бота Money Treker в момент ввода.
 *
 * Лежит вне /api/crm намеренно: там стоит сессионная защита для браузера,
 * а сюда ходит сервис. Доступ — по общему секрету.
 */

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRM_INGEST_SECRET;
  // Без заданного секрета приём выключен: открытый эндпоинт, пишущий платежи,
  // опаснее, чем неработающая интеграция
  if (!secret) return false;
  return request.headers.get("x-ingest-secret") === secret;
}

function readTransaction(body: Record<string, unknown>): IncomingMtTransaction | null {
  const id = String(body.id || "").trim();
  const type = body.type === "income" ? "income" : body.type === "expense" ? "expense" : null;
  const amount = Number(body.amount);
  if (!id || !type || !Number.isFinite(amount) || amount <= 0) return null;

  return {
    id,
    type,
    amount,
    occurred_at: String(body.occurred_at || new Date().toISOString()),
    comment: body.comment ? String(body.comment) : null,
    category: body.category ? String(body.category) : null,
  };
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "suggest");
  const actor = String(body.actor || "bot:money-treker");
  const id = String(body.id || "").trim();

  // Списки для кнопок бота. Отдельное действие, потому что здесь ещё нет
  // ни суммы, ни типа операции — только выбор, куда её отнести
  if (action === "options") {
    const orders = getCrmDb()
      .prepare(
        `SELECT id, title FROM orders WHERE status NOT IN ('done', 'cancelled')
         ORDER BY deadline IS NULL, deadline`,
      )
      .all();
    return NextResponse.json({ orders, categories: getExpenseCategories() });
  }

  if (action === "suggest") {
    const tx = readTransaction(body);
    if (!tx) {
      return NextResponse.json({ error: "Нужны id, type и amount" }, { status: 400 });
    }
    // Сохраняем сразу: даже если бот не дождётся ответа, операция уже видна
    // в очереди разбора, а не потеряется до утренней выгрузки
    saveMtInbox(tx);
    return NextResponse.json(suggestForTransaction(tx));
  }

  // На подтверждении бот присылает только id — данные операции уже у нас,
  // иначе не уложиться в лимит callback_data Telegram
  const stored = getMtInboxTransaction(id);
  if (!stored) {
    return NextResponse.json({ error: "Операция не найдена" }, { status: 404 });
  }

  if (action === "link") {
    const result = ingestMtTransaction(
      stored,
      {
        orderId: body.orderId ? Number(body.orderId) : undefined,
        contractorId: body.contractorId ? Number(body.contractorId) : undefined,
        // накладной расход к сделке не относится — у него статья, а не проект
        categoryId: body.categoryId ? Number(body.categoryId) : undefined,
      },
      actor,
    );
    return NextResponse.json(result);
  }

  // «В разбор» — платёж не создаём, операция уже лежит в инбоксе и видна
  // в очереди CRM как неразнесённая
  if (action === "review") {
    return NextResponse.json({ queued: true });
  }

  if (action === "skip") {
    dismissMtTransaction(id, actor);
    return NextResponse.json({ skipped: true });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
