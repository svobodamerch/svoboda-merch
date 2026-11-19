/** Без импорта БД — безопасно тянуть в клиентские компоненты */
export const ARCHIVE_KINDS = [
  { key: "contract", label: "Договор" },
  { key: "addendum", label: "Доп. соглашение / спецификация" },
  { key: "invoice", label: "Счёт" },
  { key: "act", label: "Акт" },
  { key: "upd", label: "УПД / накладная" },
  { key: "receipt", label: "Чек / квитанция" },
  { key: "proposal", label: "КП / смета" },
  { key: "mockup", label: "Макет / ТЗ" },
  { key: "requisites", label: "Реквизиты / карточка" },
  { key: "letter", label: "Письмо / переписка" },
  { key: "legal", label: "Учредительные / налоговые" },
  { key: "photo", label: "Фото" },
  { key: "other", label: "Прочее" },
] as const;

export type ArchiveKind = (typeof ARCHIVE_KINDS)[number]["key"];

export const ARCHIVE_KIND_LABEL: Record<string, string> = Object.fromEntries(ARCHIVE_KINDS.map((k) => [k.key, k.label]));
