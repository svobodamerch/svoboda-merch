"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";

const tabs = [
  { href: "/admin/crm", label: "Дашборд" },
  { href: "/admin/crm/orders", label: "Сделки" },
  { href: "/admin/crm/contractors", label: "Контрагенты" },
  { href: "/admin/crm/products", label: "Товары" },
  { href: "/admin/crm/payments", label: "Деньги" },
  { href: "/admin/crm/proposals", label: "КП" },
  { href: "/admin/crm/tasks", label: "Задачи" },
  { href: "/admin/crm/calendar", label: "Календарь" },
  { href: "/admin/crm/knowledge", label: "База знаний" },
  { href: "/admin/crm/review", label: "Разбор" },
  { href: "/admin/crm/legal-entities", label: "Юрлица" },
];

export default function CrmLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch("/api/crm/review")
      .then((r) => r.json())
      .then((d) => setReviewCount(d.costs?.length || 0))
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/crm/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const tabLabel = (tab: (typeof tabs)[number]) =>
    tab.href === "/admin/crm/review" && reviewCount > 0 ? `${tab.label} · ${reviewCount}` : tab.label;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="label-lg text-ink">[СВОБОДА]* CRM</span>
            <nav className="hidden gap-1 sm:flex">
              {tabs.map((tab) => {
                const active =
                  tab.href === "/admin/crm" ? pathname === tab.href : pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`pill label ${
                      active ? "bg-ink text-bg" : "text-ink-soft hover:bg-surface hover:text-ink"
                    }`}
                  >
                    {tabLabel(tab)}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button type="button" onClick={logout} className="label text-ink-soft hover:text-accent">
            Выйти
          </button>
        </Container>
        <Container className="flex gap-1 pb-3 sm:hidden">
          {tabs.map((tab) => {
            const active = tab.href === "/admin/crm" ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`pill label ${
                  active ? "bg-ink text-bg" : "text-ink-soft hover:bg-surface hover:text-ink"
                }`}
              >
                {tabLabel(tab)}
              </Link>
            );
          })}
        </Container>
      </header>

      <Container className="py-8">{children}</Container>
    </div>
  );
}
