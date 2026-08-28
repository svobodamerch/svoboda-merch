"use client";

import { useEffect, useRef, useState } from "react";

type Attachment = {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

function size(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const isImage = (mime: string) => mime.startsWith("image/");

/** Брифы, сметы, референсы — файл как есть, без встраивания PDF целиком. Используется и заказами, и проектами. */
export function Attachments({ endpoint }: { endpoint: string }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) => setItems(d.attachments || []));
  };

  useEffect(load, [endpoint]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      const r = await fetch(endpoint, { method: "POST", body: form });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error || `Не удалось загрузить «${file.name}»`);
      }
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить файл?")) return;
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    load();
  };

  const fileUrl = (id: number) => `${endpoint}/${id}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="section-title">Файлы</p>
        <label className="pill label bg-accent text-bg hover:bg-accent-soft cursor-pointer">
          {busy ? "…" : "+ загрузить"}
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="label mb-3 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((a) => (
            <div key={a.id} className="group relative rounded-xl bg-surface p-2">
              <a href={fileUrl(a.id)} target="_blank" rel="noopener noreferrer" className="block">
                {isImage(a.mime_type) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(a.id)} alt={a.original_name} className="h-24 w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-lg bg-tint text-3xl">
                    {a.mime_type === "application/pdf" ? "📄" : "📎"}
                  </div>
                )}
                <p className="label text-ink-soft mt-1.5 truncate" title={a.original_name}>
                  {a.original_name}
                </p>
                <p className="label text-muted">{size(a.size_bytes)}</p>
              </a>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="label absolute right-1 top-1 hidden rounded-md bg-bg px-1.5 py-0.5 text-muted hover:text-red-700 group-hover:block"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <p className="label text-muted">Файлов пока нет — бриф, смета, референсы</p>}
    </div>
  );
}
