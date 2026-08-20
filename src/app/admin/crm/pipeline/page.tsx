"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ContractorPicker } from "@/components/crm/ContractorPicker";
import { dealStageLabel, OPEN_STAGES, type DealStage } from "@/lib/crm/sales-types";

type Contractor = { id: number; name: string; company: string | null };

type Deal = {
  id: number;
  contractor_id: number | null;
  contractor_name: string | null;
  title: string;
  stage: DealStage;
  amount_kopecks: number;
  probability: number;
  expected_close_date: string | null;
  next_action: string | null;
  lost_reason: string | null;
  order_id: number | null;
};

type Pipeline = {
  deals: Deal[];
  totalKopecks: number;
  weightedKopecks: number;
  closingThisMonthKopecks: number;
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [all, setAll] = useState<Deal[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    contractorId: "",
    amount: "",
    stage: "new" as DealStage,
    expectedCloseDate: "",
    nextAction: "",
  });

  const load = () => {
    fetch("/api/crm/deals")
      .then((r) => r.json())
      .then((d) => {
        setPipeline(d.pipeline);
        setAll(d.all);
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
    await fetch("/api/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", contractorId: "", amount: "", stage: "new", expectedCloseDate: "", nextAction: "" });
    setShowForm(false);
    setBusy(false);
    load();
  };

  const patch = async (id: number, body: Record<string, unknown>) => {
    setBusy(true);
    const r = await fetch(`/api/crm/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    setBusy(false);
    if (d.error) alert(d.error);
    load();
  };

  const lose = async (id: number) => {
    const reason = prompt("Почему проиграли? Причина пригодится потом");
    if (reason === null) return;
    await patch(id, { action: "lose", reason });
  };

  if (!pipeline) return <p className="label text-muted">Загрузка…</p>;

  const closed = all.filter((d) => d.stage === "won" || d.stage === "lost");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-lg text-ink">Воронка</p>
          <p className="label text-muted mt-1">
            Сделка — обещание будущей выручки. В прибыль проектов она попадёт только после выигрыша,
            когда станет проектом со своей себестоимостью.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="pill label bg-accent text-bg hover:bg-accent-soft"
        >
          {showForm ? "Отмена" : "+ сделка"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Воронка</p>
          <p className="label-lg text-ink">{money(pipeline.totalKopecks)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">С поправкой на вероятность</p>
          <p className="label-lg text-ink">{money(pipeline.weightedKopecks)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="label text-muted mb-1">Закрываются в этом месяце</p>
          <p className="label-lg text-ink">{money(pipeline.closingThisMonthKopecks)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid gap-2 rounded-2xl bg-surface p-5 sm:grid-cols-2">
          <input
            className={field}
            placeholder="О чём сделка *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <ContractorPicker
            contractors={contractors}
            value={form.contractorId}
            onChange={(id) => setForm((f) => ({ ...f, contractorId: id }))}
          />
          <input
            className={field}
            placeholder="Сумма"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <select
            className={field}
            value={form.stage}
            onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as DealStage }))}
          >
            {OPEN_STAGES.map((s) => (
              <option key={s} value={s}>
                {dealStageLabel[s]}
              </option>
            ))}
          </select>
          <input
            className={field}
            type="date"
            value={form.expectedCloseDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
          />
          <input
            className={field}
            placeholder="Следующий шаг"
            value={form.nextAction}
            onChange={(e) => setForm((f) => ({ ...f, nextAction: e.target.value }))}
          />
          <button
            type="submit"
            disabled={busy}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted sm:col-span-2"
          >
            Добавить
          </button>
        </form>
      )}

      <div className="space-y-6">
        {OPEN_STAGES.map((stage) => {
          const inStage = pipeline.deals.filter((d) => d.stage === stage);
          if (inStage.length === 0) return null;
          return (
            <div key={stage}>
              <p className="label text-accent mb-3">
                {dealStageLabel[stage]} · {inStage.length} ·{" "}
                {money(inStage.reduce((s, d) => s + d.amount_kopecks, 0))}
              </p>
              <ul className="divide-y divide-line border-t border-line">
                {inStage.map((d) => (
                  <li key={d.id} className="py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="label text-ink">{d.title}</span>
                      <span className="label text-ink">
                        {money(d.amount_kopecks)}
                        <span className="text-muted"> · {d.probability}%</span>
                      </span>
                    </div>
                    <p className="label text-muted mt-1">
                      {d.contractor_name || "клиент не указан"}
                      {d.expected_close_date &&
                        ` · до ${new Date(d.expected_close_date).toLocaleDateString("ru-RU")}`}
                      {d.next_action && ` · дальше: ${d.next_action}`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <select
                        className="rounded-xl border border-line bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                        value={d.stage}
                        onChange={(e) => patch(d.id, { stage: e.target.value })}
                      >
                        {OPEN_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {dealStageLabel[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => patch(d.id, { action: "win" })}
                        disabled={busy}
                        className="label text-accent hover:underline"
                      >
                        Выиграли — создать проект
                      </button>
                      <button
                        type="button"
                        onClick={() => lose(d.id)}
                        disabled={busy}
                        className="label text-muted hover:text-ink"
                      >
                        Проиграли
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {pipeline.deals.length === 0 && <p className="label text-muted">Открытых сделок нет</p>}
      </div>

      {closed.length > 0 && (
        <div>
          <p className="label text-accent mb-3">Закрытые · {closed.length}</p>
          <ul className="divide-y divide-line border-t border-line">
            {closed.map((d) => (
              <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <div>
                  <span className="label text-ink-soft">{d.title}</span>
                  <p className="label text-muted mt-0.5">
                    {dealStageLabel[d.stage]}
                    {d.lost_reason && ` · ${d.lost_reason}`}
                    {d.order_id && (
                      <>
                        {" · "}
                        <Link href={`/admin/crm/orders/${d.order_id}`} className="text-accent">
                          проект →
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <span className="label text-muted">{money(d.amount_kopecks)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
