"use client";

import { useEffect, useRef, useState } from "react";

type Contractor = { id: number; name: string; company?: string | null };

const field =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent";

/**
 * Список контрагентов растёт, и обычный <select> с сотней имён неудобно
 * пролистывать. Начинаешь печатать — фильтруются совпадения по имени и
 * компании; можно оставить поле пустым, если контрагент ещё не известен.
 */
export function ContractorPicker({
  contractors,
  value,
  onChange,
  placeholder = "Поставщик — не указан",
  allowEmpty = true,
}: {
  contractors: Contractor[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const selected = contractors.find((c) => String(c.id) === value);
  const [query, setQuery] = useState(selected?.name || "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.name || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const matches = q
    ? contractors.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q),
      )
    : contractors;

  const pick = (c: Contractor | null) => {
    onChange(c ? String(c.id) : "");
    setQuery(c?.name || "");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        className={field}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
      />
      {open && (matches.length > 0 || allowEmpty) && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-line bg-bg py-1 shadow-lg">
          {allowEmpty && (
            <li>
              <button
                type="button"
                onClick={() => pick(null)}
                className="label w-full px-3 py-2 text-left text-muted hover:bg-tint"
              >
                {placeholder}
              </button>
            </li>
          )}
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => pick(c)}
                className="label flex w-full flex-col px-3 py-2 text-left hover:bg-tint"
              >
                <span className="text-ink">{c.name}</span>
                {c.company && c.company !== c.name && <span className="text-muted">{c.company}</span>}
              </button>
            </li>
          ))}
          {matches.length === 0 && !allowEmpty && (
            <li className="label px-3 py-2 text-muted">Ничего не найдено</li>
          )}
        </ul>
      )}
    </div>
  );
}
