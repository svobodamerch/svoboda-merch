"use client";

import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type CostRow = {
  id: number;
  order_id: number;
  order_title: string;
  kind: "material" | "work" | "logistics" | "other";
  title: string;
  quantity: number;
  unit: string;
  amount_kopecks: number;
  status: "planned" | "confirmed" | "paid";
};
type PaymentRow = { id: number; amount_kopecks: number; comment: string | null; paid_at: string };
type Data = {
  contractorName: string;
  costs: CostRow[];
  payments: PaymentRow[];
  totalAccruedKopecks: number;
  totalPaidKopecks: number;
  remainingKopecks: number;
};

const statusLabel: Record<CostRow["status"], string> = {
  planned: "Планируется",
  confirmed: "Заказано",
  paid: "Оплачено",
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export default function ContractorPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [password, setPassword] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await fetch(`/api/portal/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error || "Ошибка");
      return;
    }
    setData(d);
  };

  if (!data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <p className="label-lg text-ink mb-1">[СВОБОДА]*</p>
        <p className="label text-muted mb-6">Сверка заказов</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-[15px] text-ink outline-none focus:border-accent"
            placeholder="Пароль — ваш номер телефона без 8"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="label text-accent">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="w-full rounded-xl bg-ink px-4 py-3 label text-bg disabled:opacity-50"
          >
            {busy ? "…" : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  const byOrder = new Map<number, { title: string; rows: CostRow[] }>();
  for (const c of data.costs) {
    if (!byOrder.has(c.order_id)) byOrder.set(c.order_id, { title: c.order_title, rows: [] });
    byOrder.get(c.order_id)!.rows.push(c);
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <div>
        <p className="label-lg text-ink">{data.contractorName}</p>
        <p className="label text-muted">Сверка по работе</p>
      </div>

      <div className="rounded-2xl bg-tint p-6">
        <p className="label text-accent mb-1">
          {data.remainingKopecks >= 0 ? "Остаток долга нам перед вами" : "Переплата"}
        </p>
        <p className="display text-ink" style={{ fontSize: "1.9rem" }}>
          {money(Math.abs(data.remainingKopecks))}
        </p>
        <p className="label text-muted mt-3">
          Начислено {money(data.totalAccruedKopecks)} · Оплачено {money(data.totalPaidKopecks)}
        </p>
      </div>

      <div>
        <p className="label text-accent mb-3">Работа по заказам</p>
        <div className="space-y-4">
          {[...byOrder.entries()].map(([orderId, group]) => (
            <div key={orderId} className="rounded-2xl bg-surface p-4">
              <p className="label text-ink mb-2">{group.title}</p>
              <ul className="divide-y divide-line">
                {group.rows.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="label text-ink-soft truncate">{r.title}</p>
                      <p className="label text-muted">
                        {r.quantity !== 1 ? `${r.quantity} ${r.unit} · ` : ""}
                        {statusLabel[r.status]}
                      </p>
                    </div>
                    <span className="label text-ink shrink-0">{money(r.amount_kopecks)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {data.costs.length === 0 && <p className="label text-muted">Пока пусто</p>}
      </div>

      <div>
        <p className="label text-accent mb-3">История оплат</p>
        <ul className="divide-y divide-line border-t border-line">
          {data.payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="label text-ink">{p.comment || "Оплата"}</p>
                <p className="label text-muted">{new Date(p.paid_at).toLocaleDateString("ru-RU")}</p>
              </div>
              <span className="label text-accent shrink-0">{money(p.amount_kopecks)}</span>
            </li>
          ))}
        </ul>
        {data.payments.length === 0 && <p className="label text-muted">Оплат ещё не было</p>}
      </div>
    </div>
  );
}
