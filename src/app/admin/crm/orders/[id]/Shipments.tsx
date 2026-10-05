"use client";

import { useEffect, useState } from "react";
import type { OrderShipment } from "@/lib/crm/db";

const STATUSES: [OrderShipment["status"], string][] = [
  ["waiting", "Ждёт готовности"],
  ["packing", "Упаковка"],
  ["shipped", "Отправлено"],
  ["delivered", "Доставлено"],
];
const input = "w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-[13px] text-ink outline-none focus:border-accent";

export function Shipments({ orderId }: { orderId: string }) {
  const base = `/api/crm/orders/${orderId}/shipments`;
  const [rows, setRows] = useState<OrderShipment[]>([]);

  const load = () =>
    fetch(base)
      .then((r) => r.json())
      .then((d) => setRows(d.shipments));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const patch = (id: number, field: string, value: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const save = (id: number, field: string, value: string) =>
    fetch(`${base}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });

  const add = async () => {
    await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: "Новый адрес" }) });
    load();
  };
  const remove = async (id: number) => {
    if (!confirm("Удалить отправку?")) return;
    await fetch(`${base}/${id}`, { method: "DELETE" });
    load();
  };

  const field = (r: OrderShipment, key: keyof OrderShipment, label: string) => (
    <label className="block">
      <span className="label text-muted">{label}</span>
      <input
        className={input}
        value={(r[key] as string | null) ?? ""}
        onChange={(e) => patch(r.id, key, e.target.value)}
        onBlur={(e) => save(r.id, key, e.target.value)}
      />
    </label>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="section-title">Отправки и получатели</p>
        <button type="button" onClick={add} className="pill label bg-surface text-ink-soft hover:bg-tint">
          + адрес
        </button>
      </div>
      {rows.length === 0 && <p className="label text-muted">Адресов пока нет.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl bg-surface p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                className={`${input} font-medium`}
                value={r.city}
                onChange={(e) => patch(r.id, "city", e.target.value)}
                onBlur={(e) => save(r.id, "city", e.target.value)}
              />
              <select
                className="rounded-lg border border-line bg-bg px-2 py-1.5 text-[13px]"
                value={r.status}
                onChange={(e) => {
                  patch(r.id, "status", e.target.value);
                  save(r.id, "status", e.target.value);
                }}
              >
                {STATUSES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            {field(r, "recipient", "Получатель")}
            {field(r, "address", "Адрес")}
            {field(r, "phone", "Телефон")}
            {field(r, "contents", "Что в посылке")}
            <div className="grid grid-cols-3 gap-2">
              {field(r, "carrier", "Служба")}
              {field(r, "sender", "Кто отправляет")}
              {field(r, "tracking", "Трек")}
            </div>
            <button type="button" onClick={() => remove(r.id)} className="label text-muted hover:text-red-700">
              Удалить
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
