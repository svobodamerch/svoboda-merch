"use client";

import { useEffect, useState } from "react";

type LegalEntity = { id: number; short_name: string; tax_regime: string; tax_rate: number };
type Tax = { legalEntity: LegalEntity | null; baseKopecks: number; taxKopecks: number };

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const regimeLabel: Record<string, string> = {
  usn_income: "УСН «Доходы»",
  usn_income_minus_expense: "УСН «Доходы минус расходы»",
};

const field =
  "rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export function OrderLegalEntity({
  orderId,
  legalEntityId,
  onChanged,
}: {
  orderId: string;
  legalEntityId: number | null;
  onChanged: () => void;
}) {
  const [entities, setEntities] = useState<LegalEntity[]>([]);
  const [tax, setTax] = useState<Tax | null>(null);
  const [saving, setSaving] = useState(false);

  const loadTax = () => {
    fetch(`/api/crm/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setTax(d.tax));
  };

  useEffect(() => {
    fetch("/api/crm/legal-entities")
      .then((r) => r.json())
      .then((d) => setEntities(d.entities));
    loadTax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const changeEntity = async (id: string) => {
    if (!id) return;
    setSaving(true);
    await fetch(`/api/crm/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ legalEntityId: Number(id) }),
    });
    setSaving(false);
    loadTax();
    onChanged();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-4">
      <span className="label text-muted">Юрлицо:</span>
      <select
        className={field}
        value={legalEntityId ?? ""}
        onChange={(e) => changeEntity(e.target.value)}
        disabled={saving}
      >
        <option value="" disabled>
          Не выбрано
        </option>
        {entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.short_name} · {regimeLabel[e.tax_regime] || e.tax_regime}
          </option>
        ))}
      </select>
      {tax?.legalEntity && (
        <span className="label text-ink-soft">
          Налог с поступлений: <span className="text-ink">{money(tax.taxKopecks)}</span>
          {" "}({tax.legalEntity.tax_rate}% от {money(tax.baseKopecks)})
        </span>
      )}
    </div>
  );
}
