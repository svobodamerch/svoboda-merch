"use client";

import { useState } from "react";
import type { ContractorBalance } from "@/lib/crm/reconciliation";

/**
 * Баланс с расшифровкой. Одна цифра без объяснения бесполезна: раньше
 * у подрядчика писалось «должен нам», хотя это мы платили ей за пошив.
 */

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

export function ContractorBalanceBlock({
  balance,
  contractorId,
  onChanged,
}: {
  balance: ContractorBalance;
  contractorId: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const isSupplier = balance.role === "supplier";
  const outstanding = balance.outstandingKopecks;
  const label = isSupplier ? "Мы должны" : "Должен нам";

  const save = async (action: "opening" | "accept" | "reopen") => {
    setBusy(true);
    await fetch(`/api/crm/contractors/${contractorId}/reconciliation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, openingBalance: opening, note }),
    });
    setOpening("");
    setNote("");
    setBusy(false);
    setOpen(false);
    onChanged();
  };

  return (
    <div className="mt-3">
      <p className={`label ${outstanding > 0 ? "text-accent" : "text-ink-soft"}`}>
        {outstanding === 0
          ? "Баланс закрыт"
          : outstanding > 0
            ? `${label}: ${money(outstanding)}`
            : `Переплата: ${money(-outstanding)}`}
      </p>

      <p className="label text-muted mt-1">
        {balance.openingKopecks !== 0 && `начальный остаток ${money(balance.openingKopecks)} · `}
        начислено {money(balance.accruedKopecks)} · оплачено {money(balance.paidKopecks)}
      </p>

      {balance.hasDiscrepancy && (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3">
          <p className="label text-amber-700">
            Расхождение {money(balance.discrepancyKopecks)}: заплачено больше, чем начислено.
          </p>
          <p className="label text-amber-700 mt-1">
            Обычно причина одна из двух — начисление не заведено, либо это долг с прошлого периода.
          </p>
        </div>
      )}

      {balance.acceptedAt && (
        <p className="label text-muted mt-2">
          Расхождение принято {new Date(balance.acceptedAt).toLocaleDateString("ru-RU")}
          {balance.note ? ` · ${balance.note}` : ""}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="label text-accent mt-2 hover:underline"
      >
        {open ? "Свернуть" : "Сверка"}
      </button>

      {open && (
        <div className="mt-3 space-y-2 rounded-xl bg-surface p-4">
          <p className="label text-muted">
            Начальный остаток — долг на момент, когда начали вести учёт здесь.
            {isSupplier ? " Плюс означает, что мы были должны." : " Плюс означает, что был должен он."}
          </p>
          <input
            className={field}
            placeholder={`Начальный остаток, сейчас ${money(balance.openingKopecks)}`}
            inputMode="decimal"
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
          <input
            className={field}
            placeholder="Пояснение"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => save("opening")}
              disabled={busy || !opening}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              Сохранить остаток
            </button>
            {balance.hasDiscrepancy && (
              <button
                type="button"
                onClick={() => save("accept")}
                disabled={busy}
                className="pill label bg-bg text-ink-soft hover:text-ink"
              >
                Принять расхождение
              </button>
            )}
            {balance.acceptedAt && (
              <button
                type="button"
                onClick={() => save("reopen")}
                disabled={busy}
                className="pill label bg-bg text-ink-soft hover:text-ink"
              >
                Вернуть в разбор
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
