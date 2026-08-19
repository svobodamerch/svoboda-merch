"use client";

import { useState } from "react";

/** Ссылка-портал для подрядчика: сверка её собственных заказов и оплат, доступ по паролю (телефон без 8) */
export function PortalLink({ contractorId, slug: initialSlug }: { contractorId: string; slug: string | null }) {
  const [slug, setSlug] = useState(initialSlug);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const link = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${slug}` : "";

  const create = async () => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/crm/contractors/${contractorId}/portal`, { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (d.slug) setSlug(d.slug);
    else setError(d.error || "Не удалось создать ссылку");
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl bg-surface p-5">
      <p className="label text-accent mb-2">Портал подрядчика</p>
      {slug ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="label text-ink-soft break-all">{link}</span>
          <button type="button" onClick={copy} className="label text-accent hover:underline shrink-0">
            {copied ? "Скопировано" : "Копировать"}
          </button>
        </div>
      ) : (
        <>
          <p className="label text-muted mb-3">
            Ссылка на сверку заказов и оплат — можно отправить подрядчику. Вход по паролю (её номер телефона без 8).
          </p>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
          >
            {busy ? "…" : "Создать ссылку"}
          </button>
          {error && <p className="label mt-2 text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
