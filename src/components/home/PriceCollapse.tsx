"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Складывающийся блок прайса: заголовок всегда виден, остальное раскрывается по клику */
export function PriceCollapse({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  // Переход по ссылке /#price раскрывает блок
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#price") setOpen(true);
    };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="price-body"
        className="pill label dashed mb-2 !px-6 !py-3 hover:bg-bg"
      >
        {open ? "Свернуть прайс ↑" : "Показать прайс ↓"}
      </button>
      <div id="price-body" hidden={!open} className="mt-8">
        {children}
      </div>
    </>
  );
}
