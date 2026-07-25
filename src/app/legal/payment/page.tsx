import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Способы оплаты — Свобода Мерч",
};

const methods = [
  {
    title: "Банковская карта",
    desc: "Visa, Mastercard, МИР — оплата через защищённый платёжный шлюз. Данные карты не хранятся на нашем сервере.",
  },
  {
    title: "Система быстрых платежей (СБП)",
    desc: "Перевод по номеру телефона через приложение вашего банка. Без комиссии для физических лиц.",
  },
  {
    title: "Безналичный расчёт (счёт)",
    desc: "Для юридических лиц и ИП — выставляем счёт с НДС или без. Оплата по реквизитам в любом банке.",
  },
  {
    title: "Наличные (самовывоз)",
    desc: "При получении заказа лично в Новосибирске или Москве. Выдаём кассовый чек.",
  },
];

export default function PaymentPage() {
  return (
    <article>
      <h1 className="mb-2 text-ink" style={{ fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", letterSpacing: "-0.02em" }}>
        Способы оплаты
      </h1>
      <p className="mb-10 text-muted" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
        Мы принимаем оплату несколькими удобными способами. Все транзакции
        защищены и проходят через сертифицированные платёжные системы.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {methods.map((m) => (
          <div key={m.title} className="rounded-2xl border border-line bg-paper p-6">
            <h2 className="mb-2 text-ink" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {m.title}
            </h2>
            <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.65 }}>
              {m.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-surface p-6">
        <h2 className="mb-3 text-ink" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
          Безопасность платежей
        </h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          Оплата банковской картой осуществляется через защищённое соединение (SSL/TLS).
          Данные карты передаются непосредственно в платёжный сервис и не поступают
          на наши серверы. Мы работаем только с сертифицированными платёжными партнёрами,
          соответствующими стандарту PCI DSS.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-6">
        <h2 className="mb-3 text-ink" style={{ fontWeight: 600, fontSize: "0.95rem" }}>
          Валюта и НДС
        </h2>
        <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          Все цены указаны в российских рублях (₽). ИП Лялин А.С. применяет
          упрощённую систему налогообложения (УСН). НДС не облагается. По
          запросу предоставляются все необходимые закрывающие документы.
        </p>
      </div>
    </article>
  );
}
