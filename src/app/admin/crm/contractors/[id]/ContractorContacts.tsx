"use client";

import { useEffect, useState } from "react";

type Contact = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
};

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

const emptyForm = { name: "", role: "", phone: "", email: "", telegram: "" };

/** У организации подписант и менеджер проекта почти всегда разные люди — контактов может быть несколько */
export function ContractorContacts({ contractorId }: { contractorId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => {
    fetch(`/api/crm/contractors/${contractorId}/contacts`)
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts));
  };

  useEffect(load, [contractorId]);

  const submit = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    await fetch(`/api/crm/contractors/${contractorId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowForm(false);
    setBusy(false);
    load();
  };

  const remove = async (contactId: number) => {
    setBusy(true);
    await fetch(`/api/crm/contractor-contacts/${contactId}`, { method: "DELETE" });
    setBusy(false);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="section-title">Контактные лица</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "+ контакт"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 grid gap-2 rounded-xl bg-surface p-3 sm:grid-cols-2">
          <input
            className={field}
            placeholder="Имя *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Роль (подписант, менеджер…)"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Телефон"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Telegram"
            value={form.telegram}
            onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
          />
          <input
            className={`${field} sm:col-span-2`}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !form.name.trim()}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            {busy ? "…" : "Добавить"}
          </button>
        </div>
      )}

      <ul className="divide-y divide-line border-t border-line">
        {contacts.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="label text-ink">
                {c.name}
                {c.role ? ` · ${c.role}` : ""}
              </p>
              <p className="label text-muted">
                {[c.phone, c.telegram, c.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <button type="button" onClick={() => remove(c.id)} disabled={busy} className="label text-muted hover:text-accent">
              Убрать
            </button>
          </li>
        ))}
      </ul>
      {contacts.length === 0 && !showForm && <p className="label text-muted">Контактных лиц нет</p>}
    </div>
  );
}
