"use client";

import { useState } from "react";

export function AcceptBar({ token, initialStatus }: { token: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    const res = await fetch(`/api/proposal/${token}/accept`, { method: "POST" });
    if (res.ok) setStatus("accepted");
    setLoading(false);
  };

  return (
    <div className="print:hidden sticky bottom-0 border-t border-line bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-4 py-5 md:px-8">
        {status === "accepted" ? (
          <p className="label-lg text-accent">Принято — спасибо, свяжемся с вами</p>
        ) : (
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="pill label dashed"
            >
              Сохранить PDF
            </button>
            <button
              type="button"
              onClick={accept}
              disabled={loading}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              {loading ? "Принимаем…" : "Принять предложение"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
