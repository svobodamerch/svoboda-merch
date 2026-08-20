"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";
import { commitmentSideLabel, type CommitmentSide } from "@/lib/crm/sales-types";

type Contractor = { id: number; name: string; company: string | null };

type Commitment = {
  id: number;
  title: string;
  side: CommitmentSide;
  due_date: string | null;
  contractor_name: string | null;
  order_title: string | null;
  note: string | null;
  done_at: string | null;
};

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

function todayIso(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function CommitmentsPage() {
  const [open, setOpen] = useState<Commitment[]>([]);
  const [done, setDone] = useState<Commitment[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    side: "we" as CommitmentSide,
    dueDate: "",
    contractorId: "",
    note: "",
  });

  const load = () => {
    fetch("/api/crm/commitments")
      .then((r) => r.json())
      .then((d) => {
        setOpen(d.commitments || []);
        setDone(d.done || []);
      });
    fetch("/api/crm/contractors")
      .then((r) => r.json())
      .then((d) => setContractors(d.contractors));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    await fetch("/api/crm/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", side: "we", dueDate: "", contractorId: "", note: "" });
    setBusy(false);
    load();
  };

  const complete = async (id: number) => {
    await fetch(`/api/crm/commitments/${id}`, { method: "PATCH" });
    load();
  };

  const today = todayIso();

  return (
    <div className="space-y-10">
      <div>
        <p className="label-lg text-ink">Обещания</p>
        <p className="label text-muted mt-1">
          Кто кому что обещал. Не задача и не заметка: у обещания есть сторона, которая его дала, —
          и именно из-за забытых обещаний теряют доверие.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-2 rounded-2xl bg-surface p-5 sm:grid-cols-2">
        <input
          className={field}
          placeholder="Что обещано *"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <select
          className={field}
          value={form.side}
          onChange={(e) => setForm((f) => ({ ...f, side: e.target.value as CommitmentSide }))}
        >
          {(Object.keys(commitmentSideLabel) as CommitmentSide[]).map((s) => (
            <option key={s} value={s}>
              {commitmentSideLabel[s]}
            </option>
          ))}
        </select>
        <ContractorPicker
          contractors={contractors}
          value={form.contractorId}
          onChange={(id) => setForm((f) => ({ ...f, contractorId: id }))}
        />
        <input
          className={field}
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
        />
        <button
          type="submit"
          disabled={busy}
          className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
        >
          Записать
        </button>
      </form>

      <div>
        <p className="section-title mb-4">Открытые · {open.length}</p>
        {open.length === 0 ? (
          <p className="label text-muted">Ничего не висит</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {open.map((c) => {
              const overdue = !!c.due_date && c.due_date < today;
              return (
                <li key={c.id} className="flex items-start gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => complete(c.id)}
                    title="Выполнено"
                    className="mt-0.5 h-5 w-5 shrink-0 rounded-md border border-line hover:border-accent hover:bg-tint"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="label text-ink">{c.title}</p>
                    <p className="label text-muted mt-0.5">
                      {commitmentSideLabel[c.side]}
                      {c.contractor_name && ` · ${c.contractor_name}`}
                      {c.order_title && ` · ${c.order_title}`}
                    </p>
                  </div>
                  {c.due_date && (
                    <span className={`label shrink-0 ${overdue ? "text-accent" : "text-muted"}`}>
                      {overdue ? "просрочено · " : ""}
                      {new Date(c.due_date).toLocaleDateString("ru-RU")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {done.length > 0 && (
        <div>
          <p className="section-title mb-4">Выполненные · {done.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {done.slice(0, 20).map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 py-3">
                <span className="label text-muted">{c.title}</span>
                {c.done_at && (
                  <span className="label text-muted shrink-0">
                    {new Date(c.done_at.replace(" ", "T")).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
