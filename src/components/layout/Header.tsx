"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { mainNav, siteContact } from "@/lib/navigation";
import { Container } from "@/components/ui/Container";
import { useLeadModal } from "@/components/ui/LeadModalProvider";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { open: openLeadModal } = useLeadModal();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      {/* Светлая полоса вместо тёмной плашки */}
      <div className="label border-b border-line bg-surface py-2.5 text-center text-ink-soft">
        Швейное производство
        <span className="px-2 text-accent">·</span>
        Тираж от 1 единицы
        <span className="px-2 text-accent">·</span>
        Доставка по России
      </div>

      <header className="sticky top-0 z-50 border-b border-line bg-bg/95 backdrop-blur-sm">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="label-lg shrink-0 text-ink">
            [СВОБОДА]<span className="text-accent">*</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {mainNav.map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="pill label text-ink-soft hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="pill label text-ink-soft hover:bg-surface hover:text-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden shrink-0 lg:block">
            <button
              type="button"
              onClick={openLeadModal}
              className="pill label bg-accent text-bg !px-6 !py-3 hover:bg-accent-soft"
            >
              Оставить заявку
            </button>
          </div>

          <button
            type="button"
            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface lg:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            <div className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-0.5 w-full bg-ink transition-all ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
              />
              <span
                className={`h-0.5 w-full bg-ink transition-all ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`h-0.5 w-full bg-ink transition-all ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
              />
            </div>
          </button>
        </Container>
      </header>

      {/*
        Мобильное меню — намеренно вне <header>: у header есть backdrop-blur,
        а backdrop-filter создаёт новый containing block для потомков с
        position:fixed, из-за чего inset-0 схлопывался до высоты хедера.
      */}
      <div
        className={`fixed inset-0 z-40 overflow-y-auto bg-bg lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } transition-opacity`}
      >
        <Container className="flex min-h-full flex-col pb-8 pt-24">
          {mainNav.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="label-lg border-b border-line py-5 text-ink"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="label-lg border-b border-line py-5 text-ink"
              >
                {item.label}
              </Link>
            ),
          )}

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                openLeadModal();
              }}
              className="pill label w-full justify-center bg-accent text-bg !py-4 hover:bg-accent-soft"
            >
              Оставить заявку
            </button>
            <a
              href={siteContact.phoneHref}
              className="pill label dashed w-full justify-center !py-4"
            >
              {siteContact.phone}
            </a>
          </div>
        </Container>
      </div>
    </>
  );
}
