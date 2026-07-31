/**
 * Прайс: каждое изделие раскрывается по нажатию.
 *
 * Сделано на <details>/<summary> намеренно, а не на состоянии React:
 *  — содержимое остаётся в HTML даже когда свёрнуто, поэтому поисковики
 *    видят все цены (а цены как раз и ищут);
 *  — работает без JavaScript и правильно читается скринридерами;
 *  — раскрытие доступно с клавиатуры без дополнительного кода.
 *
 * Так же ушла главная беда прежней вёрстки: широкая таблица на телефоне
 * уезжала за край экрана.
 */

export interface PriceRow {
  name: string;
  spec: string;
  /** Цены по тиражам, в порядке PRICE_TIERS */
  prices: number[];
}

export const PRICE_TIERS = ["1–10 шт", "10–50 шт", "от 100 шт", "от 500 шт", "от 1000 шт"];
export const LEAD_TIMES = ["5–7 дней", "7–14 дней", "15–30 дней", "1–1,5 месяца", "1–2 месяца"];

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export function PriceList({ title, rows }: { title: string; rows: PriceRow[] }) {
  return (
    <div>
      <h3 className="label-lg text-ink mb-4">{title}</h3>

      <div className="border-t border-line">
        {rows.map((r) => {
          const min = Math.min(...r.prices);
          const max = Math.max(...r.prices);

          return (
            <details key={r.name} className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="label-lg text-ink block">{r.name}</span>
                  <span className="label text-muted mt-1.5 block normal-case tracking-normal">
                    {r.spec}
                  </span>
                </span>

                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="label text-ink whitespace-nowrap">
                    <span className="text-muted">от </span>
                    {money(min)}
                  </span>
                  {/* Стрелка поворачивается, когда блок раскрыт */}
                  <span
                    aria-hidden
                    className="text-accent transition-transform duration-300 group-open:rotate-180"
                  >
                    ↓
                  </span>
                </span>
              </summary>

              <div className="pb-5">
                <dl className="grid gap-2 sm:grid-cols-5">
                  {r.prices.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-3 rounded-xl bg-bg px-4 py-3 sm:block"
                    >
                      <dt className="label text-muted">
                        {PRICE_TIERS[i]}
                        <span className="mt-0.5 hidden text-[9px] normal-case tracking-normal opacity-70 sm:block">
                          {LEAD_TIMES[i]}
                        </span>
                      </dt>
                      <dd className="label-lg text-ink sm:mt-2">{money(p)}</dd>
                      <dd className="label text-muted sm:hidden">{LEAD_TIMES[i]}</dd>
                    </div>
                  ))}
                </dl>

                {min !== max && (
                  <p className="label text-muted mt-3">
                    Разница между тиражами — {money(max - min)} на единицу
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
