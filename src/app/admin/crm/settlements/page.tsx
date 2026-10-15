"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Account = { id: number; name: string; note: string | null; entries: number; disputed: number; unanswered: number };

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function SettlementsPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const load = () => {
    fetch("/api/crm/settlements")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []));
  };
  useEffect(load, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/crm/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, note }),
    });
    setName("");
    setNote("");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="label-lg text-ink">Взаиморасчёты</p>
        <p className="label text-muted mt-1">
          Когда человек проводит ваши деньги через свой счёт или вы переводите друг другу: отправьте ему ссылку, и он
          отметит каждую строку «сходится» или «не сходится».
        </p>
      </div>

      <form onSubmit={create} className="grid gap-2 rounded-2xl bg-surface p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input className={field} placeholder="С кем *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={field} placeholder="Пояснение (необязательно)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button type="submit" className="pill label bg-accent text-bg hover:bg-accent-soft">
          Завести
        </button>
      </form>

      {!accounts ? (
        <p className="label text-muted">Загрузка…</p>
      ) : accounts.length === 0 ? (
        <p className="label text-muted">Пока никого.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {accounts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <Link href={`/admin/crm/settlements/${a.id}`} className="label-lg text-ink hover:text-accent">
                  {a.name}
                </Link>
                {a.note && <p className="label text-muted mt-0.5">{a.note}</p>}
              </div>
              <p className="label text-muted">
                строк: {a.entries}
                {a.unanswered > 0 && ` · без ответа: ${a.unanswered}`}
                {a.disputed > 0 && <span className="text-amber-700"> · не сходится: {a.disputed}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
