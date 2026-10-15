"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { SettlementBalance, SettlementEntry } from "@/lib/crm/settlements";

type Data = {
  name: string;
  note: string | null;
  entries: SettlementEntry[];
  balances: { business: SettlementBalance; personal: SettlementBalance };
};

const money = (k: number) => `${(k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
const fmtDate = (d: string) => d.split("-").reverse().join(".");
const field =
  "rounded-lg border border-line bg-bg px-2.5 py-2 text-[13px] text-ink outline-none focus:border-accent";
const categoryLabel = { business: "Оплаты по сделкам", personal: "Личные переводы и займы" } as const;

function balanceText(b: SettlementBalance): string {
  if (b.balanceKopecks === 0) return "сходится в ноль";
  return b.balanceKopecks > 0 ? `у вас остаётся ${money(b.balanceKopecks)} наших денег` : `мы вам должны ${money(-b.balanceKopecks)}`;
}

export default function ReconPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Record<number, string>>({});
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: "business", direction: "out", amount: "", title: "" });
  const [added, setAdded] = useState(false);

  const load = () => {
    fetch(`/api/recon/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Ошибка");
        setData(d);
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, [token]);

  const respond = async (entryId: number, response: "agreed" | "disputed") => {
    if (response === "disputed" && !(comments[entryId] || "").trim()) {
      alert("Напишите, что не сходится — сумма, дата или вообще не было.");
      return;
    }
    await fetch(`/api/recon/${token}/entries/${entryId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response, comment: comments[entryId] || "" }),
    });
    load();
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const r = await fetch(`/api/recon/${token}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setForm((f) => ({ ...f, amount: "", title: "" }));
      setAdded(true);
      load();
    }
  };

  if (error) return <p className="label text-muted">{error}</p>;
  if (!data) return <p className="label text-muted">Загрузка…</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="label-lg text-ink">Сверка взаиморасчётов · {data.name}</p>
        <p className="label text-muted mt-2">
          Список собран из переписки и наших расчётов, он может быть неточным. По каждой строке нажмите «Сходится» или
          «Не сходится» и напишите, что не так. Если чего-то не хватает, добавьте строку внизу.
        </p>
        {data.note && <p className="label text-muted mt-1">{data.note}</p>}
        <ol className="label text-ink-soft mt-4 list-decimal space-y-1 pl-5">
          <li>Откройте каждую строку и сверьте с вашей выпиской: дату, сумму и за что.</li>
          <li>Совпало — «Сходится». Не совпало или такого не было — «Не сходится» и пара слов, что именно не так.</li>
          <li>Строка «нужно сверить» — мы сами не уверены, что платёж был: ваш ответ важнее всего.</li>
          <li>Если платёж был, а в списке его нет, добавьте его внизу.</li>
        </ol>
        <p className="label text-ink mt-4">
          Отвечено {data.entries.filter((e) => e.response).length} из {data.entries.length}
        </p>
      </div>

      {(["business", "personal"] as const).map((c) => {
        const rows = data.entries.filter((e) => e.category === c);
        if (rows.length === 0) return null;
        return (
          <div key={c}>
            <div className="mb-3">
              <p className="section-title">{categoryLabel[c]}</p>
              <p className="label text-muted mt-1">
                По нашим данным: {balanceText(data.balances[c])}
                {data.balances[c].withoutAmount > 0 && ` (ещё ${data.balances[c].withoutAmount} строк без суммы)`}
              </p>
            </div>
            <ul className="divide-y divide-line border-t border-line">
              {rows.map((e) => (
                <li key={e.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="label text-ink">
                      <span className="text-muted">{fmtDate(e.entry_date)} · </span>
                      {e.title}
                      {e.basis === "needs_check" && e.origin === "us" && <span className="text-amber-700"> · нужно сверить</span>}
                    </p>
                    <p className={`label whitespace-nowrap ${e.direction === "in" ? "text-accent" : "text-ink"}`}>
                      {e.direction === "in" ? "вам пришло / мы вам перевели " : "вы заплатили / перевели "}
                      {e.amount_kopecks == null ? "(сумма не названа)" : money(e.amount_kopecks)}
                    </p>
                  </div>
                  {e.evidence && <p className="label text-muted mt-1">{e.evidence}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => respond(e.id, "agreed")}
                      className={`pill label ${e.response === "agreed" ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:bg-tint"}`}
                    >
                      Сходится
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(e.id, "disputed")}
                      className={`pill label ${e.response === "disputed" ? "bg-amber-700 text-white" : "bg-surface text-ink-soft hover:bg-tint"}`}
                    >
                      Не сходится
                    </button>
                    <input
                      className={`${field} min-w-[200px] flex-1`}
                      placeholder="Комментарий (обязателен, если не сходится)"
                      value={comments[e.id] ?? e.response_comment ?? ""}
                      onChange={(ev) => setComments((c) => ({ ...c, [e.id]: ev.target.value }))}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <form onSubmit={add} className="space-y-2 rounded-2xl bg-surface p-4">
        <p className="label text-ink">Нет строки? Добавьте</p>
        <div className="flex flex-wrap gap-2">
          <input type="date" className={field} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <select className={field} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="business">Оплата по сделке</option>
            <option value="personal">Личный перевод</option>
          </select>
          <select className={field} value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}>
            <option value="out">Я заплатил / перевёл</option>
            <option value="in">Мне пришло / мне перевели</option>
          </select>
          <input className={`${field} w-28`} placeholder="Сумма, ₽" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <input className={`${field} min-w-[200px] flex-1`} placeholder="За что" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <button type="submit" className="pill label bg-accent text-bg hover:bg-accent-soft">
            Добавить
          </button>
        </div>
        {added && <p className="label text-muted">Строка добавлена, Андрей её увидит.</p>}
      </form>
    </div>
  );
}
