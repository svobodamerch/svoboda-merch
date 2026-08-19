/**
 * Типы и подписи денежных событий — без обращений к базе, чтобы их можно было
 * импортировать в клиентские компоненты. Вся работа с данными живёт в cash.ts,
 * который тянет better-sqlite3 и в браузерный бандл попадать не должен.
 */

/** Бизнес-смысл движения денег. Без него «−180 000 ₽» не значит ничего */
export type CashKind =
  | "client_payment"
  | "contractor_payment"
  | "project_cost"
  | "overhead"
  | "tax"
  | "owner"
  | "transfer"
  | "other";

export type CashDirection = "in" | "out";
export type CashStatus = "actual" | "expected";
export type CashConfidence = "high" | "medium" | "low";

export const cashKindLabel: Record<CashKind, string> = {
  client_payment: "Оплата клиента",
  contractor_payment: "Оплата подрядчику",
  project_cost: "Затрата по проекту",
  overhead: "Накладные",
  tax: "Налог",
  owner: "Собственник",
  transfer: "Перевод между счетами",
  other: "Не определено",
};

export const confidenceLabel: Record<CashConfidence, string> = {
  high: "Высокая",
  medium: "Средняя",
  low: "Низкая",
};

export type CashEvent = {
  id: number;
  status: CashStatus;
  direction: CashDirection;
  kind: CashKind;
  amountKopecks: number;
  /** Для факта — дата платежа, для прогноза — ожидаемая дата */
  date: string;
  confidence: CashConfidence | null;
  contractorId: number | null;
  contractorName: string | null;
  orderId: number | null;
  orderTitle: string | null;
  documentId: number | null;
  legalEntityId: number | null;
  comment: string | null;
  /** Событию не хватает смысла или привязки — попадёт в разбор */
  unattributed: boolean;
};

export type CashHorizon = {
  days: number;
  expectedInKopecks: number;
  expectedOutKopecks: number;
  /** Остаток на конец горизонта */
  projectedBalanceKopecks: number;
  /** Самая низкая точка внутри горизонта — именно она означает кассовый разрыв */
  minimumBalanceKopecks: number;
  minimumOnDate: string | null;
  /** Из ожидаемого прихода — та часть, в которой мы уверены */
  highConfidenceInKopecks: number;
};

export type CashForecast = {
  currentBalanceKopecks: number;
  balanceKnown: boolean;
  horizons: CashHorizon[];
};
