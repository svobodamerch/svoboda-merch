"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { mainNav, siteContact } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line/80 bg-cream/95 shadow-sm backdrop-blur-md"
          : "bg-cream"
      }`}
    >
      <Container className="flex h-[72px] items-center justify-between gap-4 md:h-20">
        <Link
          href="/"
          className="shrink-0 text-ink"
          style={{ fontWeight: 600, fontSize: "1.2rem", letterSpacing: "-0.01em" }}
        >
          Свобода<span style={{ color: "var(--color-accent)" }}>.</span>Мерч
        </Link>

        <nav
          ref={dropdownRef}
          className="hidden items-center gap-1 lg:flex"
          aria-label="Основная навигация"
        >
          {mainNav.map((item) =>
            item.dropdown ? (
              <div key={item.label} className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                  aria-expanded={openDropdown === item.label}
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === item.label ? null : item.label,
                    )
                  }
                >
                  {item.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {openDropdown === item.label && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-line bg-paper p-2 shadow-lg">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setOpenDropdown(null)}
                        className="block rounded-xl px-4 py-3 transition-colors hover:bg-surface"
                      >
                        <span className="block text-sm font-medium text-ink">
                          {sub.label}
                        </span>
                        {sub.description && (
                          <span className="mt-0.5 block text-xs text-muted">
                            {sub.description}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                style={{ fontWeight: 400, fontSize: "0.875rem", letterSpacing: "0.01em" }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden shrink-0 lg:block">
          <Button href="/#contact" variant="primary" size="md">
            Начать проект
          </Button>
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

      <div
        className={`fixed inset-0 z-40 overflow-y-auto lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        } transition-opacity`}
        style={{
          background: "rgba(241, 240, 235, 0.72)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        }}
      >
        <Container className="flex min-h-full flex-col pb-8 pt-24">
          {mainNav.map((item) => (
            <div key={item.label} className="border-b border-line/60 py-4">
              {item.dropdown ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted">
                    {item.label}
                  </p>
                  <div className="mt-3 space-y-1">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        onClick={() => setMenuOpen(false)}
                        className="block py-2 font-heading text-lg text-ink"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-heading text-xl text-ink"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <div className="mt-8 space-y-4">
            <Button href="/#contact" variant="primary" className="w-full">
              Начать проект
            </Button>
            <a
              href={siteContact.phoneHref}
              className="block text-center text-sm text-muted"
            >
              {siteContact.phone}
            </a>
          </div>
        </Container>
      </div>
    </header>
  );
}
