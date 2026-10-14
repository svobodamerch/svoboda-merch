"use client";

import { useEffect, useState } from "react";

type Item = {
  id: number;
  kind: "commitment_we" | "commitment_they" | "task" | "request";
  title: string;
  person_name: string | null;
  chat_title: string | null;
  deadline: string | null;
  quote: string | null;
  amount_kopecks: number | null;
  order_id: number | null;
  tg_date: string | null;
};

const kindLabel: Record<Item["kind"], string> = {
  commitment_we: "Обещали мы",
  commitment_they: "Обещали нам",
  task: "Задача / оплата",
  request: "Запрос",
};
const acceptLabel: Record<Item["kind"], string> = {
  commitment_we: "В обещания",
  commitment_they: "В обещания",
  task: "В задачи",
  request: "В задачи",
};

export default function TgInboxPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<"all" | Item["kind"]>("all");

  const load = () => {
    fetch("/api/crm/tg-inbox")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  };
  useEffect(load, []);

  const act = async (id: number, action: "accept" | "dismiss") => {
    await fetch(`/api/crm/tg-inbox/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
  };

  if (!items) return <p className="label text-muted">Загрузка…</p>;
  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-lg text-ink">Из Telegram</p>
        <p className="label text-muted mt-1">
          Обещания, деньги и запросы из рабочих чатов. Сами в задачи не попадают — подтвердите или отклоните.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "commitment_we", "commitment_they", "task", "request"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`pill label ${filter === k ? "bg-ink text-bg" : "bg-surface text-ink-soft hover:bg-tint"}`}
          >
            {k === "all" ? `Все · ${items.length}` : `${kindLabel[k]} · ${items.filter((i) => i.kind === k).length}`}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line border-t border-line">
        {shown.map((i) => (
          <li key={i.id} className="py-4">
            <p className="label text-muted">
              {kindLabel[i.kind]} · {i.person_name || "?"}
              {i.chat_title && i.chat_title !== i.person_name ? ` · ${i.chat_title}` : ""}
              {i.tg_date ? ` · ${i.tg_date.slice(0, 10)}` : ""}
              {i.order_id ? ` · сделка #${i.order_id}` : ""}
            </p>
            <p className="label-lg text-ink mt-1">{i.title}</p>
            {(i.deadline || i.amount_kopecks) && (
              <p className="label text-ink-soft mt-1">
                {i.deadline ? `срок: ${i.deadline}` : ""}
                {i.deadline && i.amount_kopecks ? " · " : ""}
                {i.amount_kopecks ? `${(i.amount_kopecks / 100).toLocaleString("ru-RU")} ₽` : ""}
              </p>
            )}
            {i.quote && <p className="label text-muted mt-1">«{i.quote}»</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => act(i.id, "accept")}
                className="pill label bg-accent text-bg hover:bg-accent-soft"
              >
                {acceptLabel[i.kind]}
              </button>
              <button
                type="button"
                onClick={() => act(i.id, "dismiss")}
                className="pill label bg-surface text-ink-soft hover:bg-tint"
              >
                Не то
              </button>
            </div>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="label text-muted">Пока ничего нового.</p>}
    </div>
  );
}
