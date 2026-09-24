"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type CostLine = { id: number; title: string; amountKopecks: number; status: string };
type Position = {
  id: number;
  title: string;
  quantity: number;
  unit: string;
  revenueKopecks: number;
  costKopecks: number;
  marginKopecks: number;
  marginPercent: number | null;
  hasCost: boolean;
  costs: CostLine[];
};
type Pnl = {
  order: { id: number; title: string; status: string };
  legalEntity: { id: number; name: string; regime: string; rate: number } | null;
  positions: Position[];
  generalCosts: CostLine[];
  pendingCosts: { id: number; title: string; amountKopecks: number; note: string | null }[];
  totals: {
    revenueKopecks: number;
    receivedKopecks: number;
    costKopecks: number;
    generalCostKopecks: number;
    pendingKopecks: number;
    preTaxProfitKopecks: number;
    taxKopecks: number;
    taxNote: string;
    netProfitKopecks: number;
    netProfitIfPendingCountedKopecks: number;
    netMarginPercent: number | null;
  };
  missingCostPositions: string[];
};

const money = (k: number) => `${(k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
const statusLabel: Record<string, string> = { planned: "план", confirmed: "согласовано", paid: "оплачено" };
const input =
  "rounded-lg border border-line bg-bg px-2.5 py-2 text-[13px] text-ink outline-none focus:border-accent";

export default function OrderPnlPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Pnl | null>(null);
  const [open, setOpen] = useState<number | "general" | null>(null);
  const [form, setForm] = useState({ title: "", amount: "" });

  const load = () => {
    fetch(`/api/crm/orders/${id}/pnl`)
      .then((r) => r.json())
      .then(setData);
  };
  useEffect(load, [id]);

  const addCost = async (e: FormEvent, itemId: number | null) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount.trim()) return;
    await fetch(`/api/crm/orders/${id}/costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, amount: form.amount, orderItemId: itemId, status: "planned" }),
    });
    setForm({ title: "", amount: "" });
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const t = data.totals;

  const CostForm = ({ itemId }: { itemId: number | null }) => (
    <form onSubmit={(e) => addCost(e, itemId)} className="mt-2 flex flex-wrap gap-2">
      <input className={`${input} min-w-[180px] flex-1`} placeholder="Что оплачено/будет оплачено" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      <input className={`${input} w-28`} placeholder="Сумма, ₽" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
      <button type="submit" className="pill label bg-accent text-bg hover:bg-accent-soft">
        + затрата
      </button>
    </form>
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/crm/orders/${id}`} className="label text-muted hover:text-ink">
          ← Сделка
        </Link>
        <p className="label-lg text-ink mt-2">{data.order.title}</p>
        <p className="label text-muted mt-1">
          Расклад по позициям и чистая прибыль ·{" "}
          {data.legalEntity ? `юрлицо: ${data.legalEntity.name}` : "юрлицо не выбрано — налог не посчитан"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Tile label="Выручка по договорам" value={money(t.revenueKopecks)} sub={`получено ${money(t.receivedKopecks)}`} />
        <Tile label="Себестоимость (внесено)" value={money(t.costKopecks)} />
        <Tile label="Налог (прогноз)" value={money(t.taxKopecks)} sub={t.taxNote} />
        <Tile
          label="Чистая прибыль"
          value={money(t.netProfitKopecks)}
          sub={t.netMarginPercent != null ? `маржа ${t.netMarginPercent}%` : undefined}
          accent
        />
      </div>

      {data.missingCostPositions.length > 0 && (
        <p className="label rounded-xl bg-amber-50 px-4 py-3 text-amber-800">
          Себестоимость не внесена по {data.missingCostPositions.length} из {data.positions.length} позиций
          ({data.missingCostPositions.join(", ")}) — прибыль выше сейчас завышена, пока не внесены затраты.
        </p>
      )}

      {data.pendingCosts.length > 0 && (
        <div className="rounded-xl bg-surface px-4 py-3">
          <p className="label text-ink">
            Затраты на проверке — {money(t.pendingKopecks)} (в прибыль не входят)
          </p>
          <ul className="mt-1">
            {data.pendingCosts.map((c) => (
              <li key={c.id} className="label text-muted">
                {c.title} — {money(c.amountKopecks)}
                {c.note ? ` · ${c.note}` : ""}
              </li>
            ))}
          </ul>
          <p className="label text-muted mt-1">Если учесть их все: чистая прибыль {money(t.netProfitIfPendingCountedKopecks)}</p>
        </div>
      )}

      <div>
        <p className="section-title mb-3">По позициям</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="label py-2 text-muted">Позиция</th>
                <th className="label py-2 text-right text-muted">Продажа</th>
                <th className="label py-2 text-right text-muted">Себестоимость</th>
                <th className="label py-2 text-right text-muted">Маржа</th>
                <th className="label py-2 text-right text-muted">%</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p) => (
                <>
                  <tr key={p.id} className="cursor-pointer border-b border-line hover:bg-surface" onClick={() => setOpen(open === p.id ? null : p.id)}>
                    <td className="label py-3 text-ink">
                      {p.title}
                      <span className="text-muted"> · {p.quantity} {p.unit}</span>
                    </td>
                    <td className="label py-3 text-right text-ink-soft">{money(p.revenueKopecks)}</td>
                    <td className={`label py-3 text-right ${p.hasCost ? "text-ink-soft" : "text-amber-700"}`}>
                      {p.hasCost ? money(p.costKopecks) : "нет данных"}
                    </td>
                    <td className="label py-3 text-right text-ink">{p.hasCost ? money(p.marginKopecks) : "—"}</td>
                    <td className="label py-3 text-right text-muted">{p.hasCost && p.marginPercent != null ? `${p.marginPercent}%` : "—"}</td>
                  </tr>
                  {open === p.id && (
                    <tr key={`${p.id}-d`}>
                      <td colSpan={5} className="pb-4">
                        <ul className="mb-1">
                          {p.costs.map((c) => (
                            <li key={c.id} className="label text-muted">
                              {c.title} — {money(c.amountKopecks)} ({statusLabel[c.status] || c.status})
                            </li>
                          ))}
                        </ul>
                        <CostForm itemId={p.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
              <tr className="cursor-pointer border-b border-line hover:bg-surface" onClick={() => setOpen(open === "general" ? null : "general")}>
                <td className="label py-3 text-ink">Общие затраты сделки (логистика, макеты, без привязки к позиции)</td>
                <td className="label py-3 text-right text-muted">—</td>
                <td className="label py-3 text-right text-ink-soft">{money(t.generalCostKopecks)}</td>
                <td className="label py-3 text-right text-muted">—</td>
                <td />
              </tr>
              {open === "general" && (
                <tr>
                  <td colSpan={5} className="pb-4">
                    <ul className="mb-1">
                      {data.generalCosts.map((c) => (
                        <li key={c.id} className="label text-muted">
                          {c.title} — {money(c.amountKopecks)} ({statusLabel[c.status] || c.status})
                        </li>
                      ))}
                    </ul>
                    <CostForm itemId={null} />
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-line">
                <td className="label-lg py-3 text-ink">Итого до налога</td>
                <td className="label-lg py-3 text-right text-ink">{money(t.revenueKopecks)}</td>
                <td className="label-lg py-3 text-right text-ink">{money(t.costKopecks)}</td>
                <td className="label-lg py-3 text-right text-accent">{money(t.preTaxProfitKopecks)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? "bg-tint" : "bg-surface"}`}>
      <p className="label text-muted">{label}</p>
      <p className={`label-lg mt-1 ${accent ? "text-accent" : "text-ink"}`}>{value}</p>
      {sub && <p className="label text-muted mt-1">{sub}</p>}
    </div>
  );
}
