/**
 * Типы воронки и обещаний — без обращений к базе, чтобы их можно было
 * импортировать в клиентские компоненты.
 */

export type DealStage =
  | "new"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "waiting_client"
  | "won"
  | "lost";

export const dealStageLabel: Record<DealStage, string> = {
  new: "Новая",
  qualified: "Квалифицирована",
  proposal: "Отправлено КП",
  negotiation: "Переговоры",
  // Своя стадия: зависание на стороне клиента — частая причина потери времени,
  // и её важно отличать от активных переговоров
  waiting_client: "Ждём клиента",
  won: "Выиграна",
  lost: "Проиграна",
};

/** Стадии, в которых сделка ещё в работе */
export const OPEN_STAGES: DealStage[] = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "waiting_client",
];

/** Вероятность по умолчанию для стадии — заданную вручную не перетираем */
export const DEFAULT_PROBABILITY: Record<DealStage, number> = {
  new: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 70,
  waiting_client: 60,
  won: 100,
  lost: 0,
};

export type CommitmentSide = "we" | "they";
export type CommitmentStatus = "open" | "done";

export const commitmentSideLabel: Record<CommitmentSide, string> = {
  we: "Обещали мы",
  they: "Обещали нам",
};
