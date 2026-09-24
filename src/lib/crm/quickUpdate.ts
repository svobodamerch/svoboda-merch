import {
  createContractorContact,
  createOrderCost,
  createPayment,
  createTask,
  getLegalEntities,
  getOrderById,
  getOrderItems,
  logActivity,
} from "./db";
import { getProjectFinancials } from "./finance";
import { getContractorBalanceDetailed } from "./reconciliation";

/**
 * Быстрое обновление сделки свободным текстом: «оплачено полностью на ИП
 * Остапович, вызвал курьера, нужно подписать документы» разбирается на
 * отдельные действия и меняет данные, а не просто ложится текстом в журнал.
 *
 * Разбор и применение — два отдельных шага. Между ними пользователь видит
 * список действий и может убрать лишнее: финансовые правки без подтверждения
 * не делаем нигде в системе, здесь тем более — на входе вольный текст, а не
 * форма.
 */

export type QuickAction =
  | {
      type: "payment";
      direction: "in" | "out";
      /** Число — точная сумма в копейках; "full" — весь остаток по проекту */
      amount: number | "full";
      legalEntityId: number | null;
      legalEntityName: string | null;
      comment: string;
    }
  | { type: "task"; title: string }
  | { type: "note"; text: string }
  /** Расход по сделке; itemHint — на какую позицию похоже (подбирается при применении) */
  | { type: "cost"; title: string; amount: number; itemHint: string | null }
  /** Урок/вывод на будущее: что сработало, что нет, на что смотреть в следующий раз */
  | { type: "experience"; text: string }
  | { type: "contact"; name: string; role: string | null; phone: string | null; telegram: string | null; email: string | null };

export type QuickUpdateResult = {
  actions: QuickAction[];
  /** Кусок текста, который ИИ не смог отнести ни к одному действию */
  unparsed: string | null;
};

const SYSTEM_PROMPT = `Ты разбираешь короткое голосовое или текстовое обновление по сделке от владельца
швейного цеха на структурированные действия. Пример входного текста: «оплачено полностью на ИП Остапович,
я вызвал курьера, все сдано, необходимо подписать документы».

Верни JSON: {"actions": [...], "unparsed": "остаток текста, который не удалось разобрать, или null"}

Каждый элемент actions — один из шести типов:

1. Платёж:
{"type": "payment", "direction": "in"|"out", "amount": число_в_рублях или "full", "legal_entity_name": "название юрлица или null", "comment": "коротко"}
"in" — нам заплатили, "out" — мы заплатили. "full" — если сказано «оплачено полностью» / «весь остаток»
без названной суммы. legal_entity_name — если названо конкретное юрлицо/ИП, иначе null.

2. Задача — что-то ещё предстоит сделать (не то, что уже сделано):
{"type": "task", "title": "короткая суть"}
«необходимо подписать документы» → задача. «я вызвал курьера» — это НЕ задача, это уже выполненное
действие, для него used type "note".

3. Заметка — то, что уже произошло и не относится к деньгам или будущим делам:
{"type": "note", "text": "что произошло"}

4. Расход по сделке — мы потратились на производство, доставку, макет, закупку и т.п. (не платёж клиенту):
{"type": "cost", "title": "на что", "amount": число_в_рублях, "item_hint": "к какой позиции заказа относится (слово из названия) или null"}
Если расход просто оплата подрядчику без привязки к товару — всё равно cost.

5. Опыт — вывод, урок, наблюдение на будущее («подрядчик срывает сроки», «ткань садится после стирки»):
{"type": "experience", "text": "суть вывода"}

6. Контакт — упомянут человек с контактными данными или ролью:
{"type": "contact", "name": "Имя", "role": "роль или null", "phone": "...или null", "telegram": "@... или null", "email": "...или null"}

Если в тексте есть куски не про сделку вообще (случайные слова, обрывки) — верни их в unparsed,
не пытайся притянуть к action силой.

Ответ — только JSON, без пояснений.`;

async function callGroq(text: string): Promise<{ actions: unknown[]; unparsed: string | null } | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    console.warn("[quickUpdate] Groq:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  try {
    return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return null;
  }
}

// Организационно-правовая форма пишется по-разному («ИП» / «Индивидуальный
// предприниматель»), поэтому сверяем не подстроку целиком, а значимые слова —
// фамилия должна встретиться, форма собственности не в счёт
const LEGAL_FORM_WORDS = new Set([
  "ип", "ооо", "зао", "оао", "ао", "пао",
  "индивидуальный", "предприниматель", "общество", "ограниченной", "ответственностью",
]);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !LEGAL_FORM_WORDS.has(w));
}

/** Название юрлица из текста сверяем по фамилии: «ИП Остапович» должно найти «Остапович Юрий Валерьевич» */
function matchLegalEntity(name: string | null): { id: number; name: string } | null {
  if (!name) return null;
  const needleWords = significantWords(name);
  if (needleWords.length === 0) return null;

  const found = getLegalEntities().find((e) => {
    const entityWords = new Set(significantWords(e.name));
    return needleWords.some((w) => entityWords.has(w));
  });
  return found ? { id: found.id, name: found.name } : null;
}

export async function parseQuickUpdate(text: string): Promise<QuickUpdateResult> {
  const raw = await callGroq(text);
  if (!raw || !Array.isArray(raw.actions)) return { actions: [], unparsed: text };

  const actions: QuickAction[] = [];
  for (const item of raw.actions as Record<string, unknown>[]) {
    if (item.type === "payment") {
      const amountRaw = item.amount;
      const amount =
        amountRaw === "full" ? ("full" as const) : Math.round(Number(amountRaw) * 100);
      if (amount !== "full" && (!Number.isFinite(amount) || amount <= 0)) continue;
      const legalEntityName = typeof item.legal_entity_name === "string" ? item.legal_entity_name : null;
      const matched = matchLegalEntity(legalEntityName);
      actions.push({
        type: "payment",
        direction: item.direction === "in" ? "in" : "out",
        amount,
        legalEntityId: matched?.id ?? null,
        legalEntityName: matched?.name ?? legalEntityName,
        comment: typeof item.comment === "string" ? item.comment : "",
      });
    } else if (item.type === "task" && typeof item.title === "string" && item.title.trim()) {
      actions.push({ type: "task", title: item.title.trim() });
    } else if (item.type === "cost") {
      const amount = Math.round(Number(item.amount) * 100);
      if (typeof item.title === "string" && item.title.trim() && Number.isFinite(amount) && amount > 0) {
        actions.push({
          type: "cost",
          title: item.title.trim(),
          amount,
          itemHint: typeof item.item_hint === "string" && item.item_hint.trim() ? item.item_hint.trim() : null,
        });
      }
    } else if (item.type === "experience" && typeof item.text === "string" && item.text.trim()) {
      actions.push({ type: "experience", text: item.text.trim() });
    } else if (item.type === "contact" && typeof item.name === "string" && item.name.trim()) {
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
      actions.push({
        type: "contact",
        name: item.name.trim(),
        role: str(item.role),
        phone: str(item.phone),
        telegram: str(item.telegram),
        email: str(item.email),
      });
    } else if (item.type === "note" && typeof item.text === "string" && item.text.trim()) {
      actions.push({ type: "note", text: item.text.trim() });
    }
  }

  return {
    actions,
    unparsed: typeof raw.unparsed === "string" && raw.unparsed.trim() ? raw.unparsed.trim() : null,
  };
}

/** Сделка, контрагент без сделки, или вообще без привязки (задача-заметка «в воздухе») */
export type ApplyTarget = { orderId: number } | { contractorId: number } | Record<string, never>;

/** Применяет подтверждённые пользователем действия к сделке, контрагенту или ни к чему конкретному */
export function applyQuickActions(target: ApplyTarget, actions: QuickAction[], actor?: string): void {
  const orderId = "orderId" in target ? target.orderId : undefined;
  const order = orderId !== undefined ? getOrderById(orderId) : undefined;
  if (orderId !== undefined && !order) throw new Error("Сделка не найдена");

  const contractorId = "contractorId" in target ? target.contractorId : order?.contractor_id ?? null;
  const entityType = orderId !== undefined ? "order" : contractorId !== null ? "contractor" : null;
  const entityId = orderId ?? contractorId ?? null;

  for (const action of actions) {
    if (action.type === "payment") {
      let amountKopecks: number;
      if (action.amount === "full") {
        if (orderId !== undefined) {
          amountKopecks = Math.max(getProjectFinancials(orderId).receivableKopecks, 0);
        } else if (contractorId !== null) {
          const outstanding = getContractorBalanceDetailed(contractorId)?.outstandingKopecks ?? 0;
          amountKopecks = Math.max(outstanding, 0);
        } else {
          continue; // "весь остаток" без сделки и контрагента посчитать не от чего
        }
      } else {
        amountKopecks = action.amount;
      }
      if (amountKopecks <= 0) continue;

      createPayment(
        {
          contractor_id: contractorId ?? undefined,
          order_id: orderId,
          direction: action.direction,
          amount_kopecks: amountKopecks,
          comment: action.comment || "Быстрое обновление",
          legal_entity_id: action.legalEntityId ?? undefined,
          source: "quick_update",
        },
        actor,
      );
    } else if (action.type === "task") {
      createTask(
        { title: action.title, order_id: orderId, contractor_id: contractorId ?? undefined, source: "quick_update" },
        actor,
      );
    } else if (action.type === "cost") {
      if (orderId === undefined) continue;
      // позицию подбираем по общим словам подсказки и названия; не нашли — общий расход сделки
      const hintWords = significantWords(action.itemHint || "");
      const item = hintWords.length
        ? getOrderItems(orderId).find((it) => {
            const words = significantWords(it.title);
            return hintWords.some((h) => words.some((w) => w.startsWith(h.slice(0, 5)) || h.startsWith(w.slice(0, 5))));
          })
        : undefined;
      createOrderCost(
        { order_id: orderId, order_item_id: item?.id, title: action.title, amount_kopecks: action.amount, status: "planned", comment: "Быстрое обновление" },
        actor,
      );
    } else if (action.type === "experience") {
      if (entityType && entityId !== null) logActivity(entityType, entityId, "experience", action.text, actor);
    } else if (action.type === "contact") {
      if (contractorId !== null) {
        createContractorContact(contractorId, {
          name: action.name,
          role: action.role ?? undefined,
          phone: action.phone ?? undefined,
          telegram: action.telegram ?? undefined,
          email: action.email ?? undefined,
        });
      }
    } else if (action.type === "note") {
      if (entityType && entityId !== null) {
        logActivity(entityType, entityId, "note", action.text, actor);
      }
    }
  }
}
