import { formatMoney } from "@/lib/crm/format";
import type { OrderItem, ProposalTemplate } from "@/lib/crm/db";

/**
 * Рендер документа КП — общий для публичной страницы /kp/[token]
 * и превью в админке, чтобы они не расходились. Никакой интерактивности
 * здесь нет (без "use client"): кнопку «Принять» и печать монтирует
 * тот, кто использует компонент.
 */

export type ProposalDocumentData = {
  template: ProposalTemplate;
  status: string;
  intro: string | null;
  solution: string | null;
  terms: string | null;
  validUntil: string | null;
  orderTitle: string;
  orderDescription: string | null;
  contractorName: string;
  contractorCompany: string | null;
  items: OrderItem[];
  totalKopecks: number;
};

function lineTotal(item: OrderItem): number {
  const gross = item.quantity * item.unit_price_kopecks;
  return Math.round(gross * (1 - item.discount_percent / 100));
}

function ItemsTable({ items, totalKopecks }: { items: OrderItem[]; totalKopecks: number }) {
  return (
    <div className="mb-10">
      <div className="hidden border-t border-line sm:block">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line py-3">
          <span className="label text-muted">Позиция</span>
          <span className="label text-muted">Кол-во</span>
          <span className="label text-muted">Цена</span>
          <span className="label text-muted text-right">Сумма</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-line py-4">
            <div>
              <p className="label-lg text-ink">{item.title}</p>
              {item.description && <p className="label text-muted mt-1">{item.description}</p>}
              {item.discount_percent > 0 && (
                <p className="label text-accent mt-1">скидка {item.discount_percent}%</p>
              )}
            </div>
            <span className="label text-ink-soft whitespace-nowrap">
              {item.quantity} {item.unit}
            </span>
            <span className="label text-ink-soft whitespace-nowrap">{formatMoney(item.unit_price_kopecks)}</span>
            <span className="label-lg text-ink whitespace-nowrap text-right">{formatMoney(lineTotal(item))}</span>
          </div>
        ))}
      </div>

      {/* Мобильная раскладка — карточки вместо таблицы */}
      <div className="space-y-3 border-t border-line pt-4 sm:hidden">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-surface p-4">
            <p className="label-lg text-ink">{item.title}</p>
            {item.description && <p className="label text-muted mt-1">{item.description}</p>}
            <div className="mt-2 flex items-baseline justify-between">
              <span className="label text-ink-soft">
                {item.quantity} {item.unit} × {formatMoney(item.unit_price_kopecks)}
                {item.discount_percent > 0 && ` · −${item.discount_percent}%`}
              </span>
              <span className="label-lg text-ink">{formatMoney(lineTotal(item))}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-between rounded-2xl bg-tint px-6 py-5">
        <span className="label text-accent">Итого</span>
        <span className="display text-ink" style={{ fontSize: "1.6rem" }}>
          {formatMoney(totalKopecks)}
        </span>
      </div>
    </div>
  );
}

export function ProposalDocument({ data }: { data: ProposalDocumentData }) {
  const isShort = data.template === "short";

  return (
    <article className="mx-auto max-w-[760px] px-4 py-10 md:px-8 md:py-16">
      <header className="mb-10">
        <p className="label text-accent mb-3">[СВОБОДА]* · коммерческое предложение</p>
        <h1 className="display text-ink mb-3" style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)" }}>
          {data.orderTitle}
        </h1>
        <p className="label text-muted">
          Для {data.contractorName}
          {data.contractorCompany ? ` · ${data.contractorCompany}` : ""}
        </p>
        {data.validUntil && (
          <p className="label text-muted mt-1">Действительно до {data.validUntil}</p>
        )}
      </header>

      {!isShort && data.intro && (
        <section className="mb-10">
          <p className="label text-accent mb-3">Задача</p>
          <p className="text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
            {data.intro}
          </p>
        </section>
      )}

      {!isShort && data.solution && (
        <section className="mb-10">
          <p className="label text-accent mb-3">Что предлагаем</p>
          <p className="text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
            {data.solution}
          </p>
        </section>
      )}

      {data.orderDescription && isShort && (
        <p className="text-ink-soft mb-8" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
          {data.orderDescription}
        </p>
      )}

      <section>
        <p className="label text-accent mb-4">Состав {isShort ? "и стоимость" : "работ и смета"}</p>
        {data.items.length > 0 ? (
          <ItemsTable items={data.items} totalKopecks={data.totalKopecks} />
        ) : (
          <p className="label text-muted mb-10">Позиции пока не добавлены</p>
        )}
      </section>

      {data.terms && (
        <section className="mb-10">
          <p className="label text-accent mb-3">Условия</p>
          <p className="text-ink-soft whitespace-pre-line" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
            {data.terms}
          </p>
        </section>
      )}
    </article>
  );
}
