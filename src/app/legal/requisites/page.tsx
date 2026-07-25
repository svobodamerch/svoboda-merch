import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Реквизиты компании — Свобода Мерч",
};

export default function RequisitesPage() {
  return (
    <article>
      <h1 className="mb-2 text-ink" style={{ fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", letterSpacing: "-0.02em" }}>
        Реквизиты компании
      </h1>
      <p className="mb-10 text-muted" style={{ fontSize: "0.875rem" }}>
        Официальные реквизиты для выставления счётов и документооборота.
      </p>

      <div className="rounded-3xl border border-line bg-paper p-8 md:p-10">
        <ReqRow label="Получатель" value="Индивидуальный предприниматель Лялин Андрей Сергеевич" />
        <ReqRow label="ИНН" value="543306833220" />
        <ReqRow label="Расчётный счёт" value="40802810020001054387" />
        <ReqRow label="Банк" value='ООО "Банк Точка"' />
        <ReqRow label="БИК" value="044525104" />
        <ReqRow label="Корр. счёт" value="30101810745374525104" last />
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-paper p-8 md:p-10">
        <p className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-muted">Контакты</p>
        <ReqRow label="Телефон" value="+7 (383) 000-00-00" />
        <ReqRow label="E-mail" value="mail@svoboda.site" />
        <ReqRow label="Сайт" value="svoboda.site" last />
      </div>

      <p className="mt-6 text-muted" style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
        Для получения закрывающих документов (акт, УПД, счёт-фактура) свяжитесь
        с нами по e-mail или телефону, указанным выше.
      </p>
    </article>
  );
}

function ReqRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 py-4 sm:flex-row sm:gap-8 ${!last ? "border-b border-line" : ""}`}>
      <span className="shrink-0 text-muted sm:w-44" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
        {label}
      </span>
      <span className="text-ink" style={{ fontSize: "0.9rem", fontWeight: 400 }}>
        {value}
      </span>
    </div>
  );
}
