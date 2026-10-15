"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { SettlementBalance, SettlementEntry } from "@/lib/crm/settlements";

type Detail = {
  account: { id: number; name: string; token: string; note: string | null };
  entries: SettlementEntry[];
  balances: { business: SettlementBalance; personal: SettlementBalance };
};

const money = (k: number) => `${(k / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
const fmtDate = (d: string) => d.split("-").reverse().join(".");
const field =
  "rounded-lg border border-line bg-bg px-2.5 py-2 text-[13px] text-ink outline-none focus:border-accent";
const categoryLabel = { business: "Оплаты по сделкам", personal: "Личные переводы и займы" } as const;

function balanceText(name: string, k: number): string {
  if (k === 0) return "сходится в ноль";
  return k > 0 ? `${name} должен нам ${money(k)}` : `мы должны ${name} ${money(-k)}`;
}

export default function SettlementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "business",
    direction: "out",
    amount: "",
    title: "",
  });

  const load = () => {
    fetch(`/api/crm/settlements/${id}`)
      .then((r) => r.json())
      .then(setData);
  };
  useEffect(load, [id]);

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { account, entries, balances } = data;
  const link = typeof window !== "undefined" ? `${window.location.origin}/recon/${account.token}` : "";
  const disputed = entries.filter((e) => e.response === "disputed").length;
  const unanswered = entries.filter((e) => !e.response).length;

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await fetch(`/api/crm/settlements/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm((f) => ({ ...f, amount: "", title: "" }));
    load();
  };
  const remove = async (entryId: number) => {
    if (!confirm("Удалить строку?")) return;
    await fetch(`/api/crm/settlements/${id}/entries/${entryId}`, { method: "DELETE" });
    load();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const rotate = async () => {
    if (!confirm("Старая ссылка перестанет работать. Продолжить?")) return;
    await fetch(`/api/crm/settlements/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rotate_token" }),
    });
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/crm/settlements" className="label text-muted hover:text-ink">
          ← Взаиморасчёты
        </Link>
        <p className="label-lg text-ink mt-2">{account.name}</p>
        {account.note && <p className="label text-muted mt-1">{account.note}</p>}
      </div>

      <div className="rounded-2xl bg-surface p-5">
        <p className="label text-ink">Ссылка для сверки</p>
        <p className="label text-muted mt-1">
          Откроется без логина, только на эту сверку. Он отметит строки и сможет добавить свои.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input readOnly className={`${field} min-w-[260px] flex-1`} value={link} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copy} className="pill label bg-accent text-bg hover:bg-accent-soft">
            {copied ? "Скопировано" : "Скопировать"}
          </button>
          <button type="button" onClick={rotate} className="pill label bg-surface text-ink-soft hover:bg-tint">
            Сменить ссылку
          </button>
        </div>
        <p className="label text-muted mt-3">
          Строк: {entries.length} · без ответа: {unanswered}
          {disputed > 0 && <span className="text-amber-700"> · не сходится: {disputed}</span>}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["business", "personal"] as const).map((c) => (
          <div key={c} className="rounded-2xl bg-surface p-4">
            <p className="label text-muted">{categoryLabel[c]}</p>
            <p className="label-lg mt-1 text-ink">{balanceText(account.name, balances[c].confirmedBalanceKopecks)}</p>
            <p className="label text-muted">только подтверждённое · со всеми строками: {balanceText(account.name, balances[c].balanceKopecks)}</p>
            <p className="label text-muted mt-1">
              пришло {money(balances[c].inKopecks)} · выплачено {money(balances[c].outKopecks)}
              {balances[c].withoutAmount > 0 && ` · без суммы: ${balances[c].withoutAmount}`}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-2xl bg-surface p-4">
        <input type="date" className={field} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        <select className={field} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          <option value="business">Оплаты по сделкам</option>
          <option value="personal">Личные переводы</option>
        </select>
        <select className={field} value={form.direction} onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value }))}>
          <option value="out">Он заплатил / перевёл</option>
          <option value="in">Ему пришло / мы перевели</option>
        </select>
        <input className={`${field} w-28`} placeholder="Сумма, ₽" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
        <input className={`${field} min-w-[220px] flex-1`} placeholder="За что *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <button type="submit" className="pill label bg-accent text-bg hover:bg-accent-soft">
          + строка
        </button>
      </form>

      {(["business", "personal"] as const).map((c) => (
        <div key={c}>
          <p className="section-title mb-3">{categoryLabel[c]}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="label py-2 text-muted">Дата</th>
                  <th className="label py-2 text-muted">За что</th>
                  <th className="label py-2 text-right text-muted">Сумма</th>
                  <th className="label py-2 pl-4 text-muted">Ответ</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries
                  .filter((e) => e.category === c)
                  .map((e) => (
                    <tr key={e.id} className="border-b border-line align-top">
                      <td className="label py-3 text-ink-soft whitespace-nowrap">{fmtDate(e.entry_date)}</td>
                      <td className="label py-3 text-ink">
                        {e.title}
                        {e.origin === "them" && <span className="text-amber-700"> · добавлено им</span>}
                        {e.basis === "needs_check" && e.origin === "us" && <span className="text-muted"> · нужно сверить</span>}
                        {e.evidence && <span className="block text-muted">{e.evidence}</span>}
                      </td>
                      <td className={`label py-3 text-right whitespace-nowrap ${e.direction === "in" ? "text-accent" : "text-ink"}`}>
                        {e.direction === "in" ? "+" : "−"}
                        {e.amount_kopecks == null ? " ?" : money(e.amount_kopecks)}
                      </td>
                      <td className="label py-3 pl-4">
                        {e.response === "agreed" && <span className="text-accent">сходится</span>}
                        {e.response === "disputed" && <span className="text-amber-700">не сходится</span>}
                        {!e.response && <span className="text-muted">ждёт ответа</span>}
                        {e.response_comment && <span className="block text-muted">«{e.response_comment}»</span>}
                      </td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => remove(e.id)} className="label text-muted hover:text-accent">
                          убрать
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
