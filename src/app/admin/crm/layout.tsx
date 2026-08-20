"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { IconBell } from "./nav-icons";
import { Container } from "@/components/ui/Container";

// Плоский список — используется только для мобильной раскладки (узкий экран, без сайдбара)
const MOBILE_TABS = [
  { href: "/admin/crm", label: "Дашборд" },
  { href: "/admin/crm/calendar", label: "Календарь" },
  { href: "/admin/crm/orders", label: "Сделки" },
  { href: "/admin/crm/tasks", label: "Задачи" },
  { href: "/admin/crm/commitments", label: "Обещания" },
  { href: "/admin/crm/pipeline", label: "Воронка" },
  { href: "/admin/crm/contractors", label: "Контрагенты" },
  { href: "/admin/crm/products", label: "Товары" },
  { href: "/admin/crm/payments", label: "Деньги" },
  { href: "/admin/crm/cash", label: "Прогноз кассы" },
  { href: "/admin/crm/reconciliation", label: "Сверка" },
  { href: "/admin/crm/documents", label: "Документы" },
  { href: "/admin/crm/legal-entities", label: "Юрлица" },
  { href: "/admin/crm/proposals", label: "КП" },
  { href: "/admin/crm/knowledge", label: "База знаний" },
  { href: "/admin/crm/review", label: "Разбор" },
];

export default function CrmLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetch("/api/crm/review")
      .then((r) => r.json())
      .then((d) =>
        setReviewCount((d.costs?.length || 0) + (d.orphanPayments?.length || 0) + (d.moneyTreker?.length || 0)),
      )
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/crm/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="hidden sm:flex print:hidden">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <header className="border-b border-line print:hidden">
            <Container className="flex h-16 items-center justify-end gap-4">
              <Link
                href="/admin/crm/review"
                title="Разбор"
                className="relative rounded-lg p-2 text-ink-soft hover:bg-tint hover:text-ink"
              >
                <IconBell className="h-5 w-5" />
                {reviewCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-bg">
                    {reviewCount}
                  </span>
                )}
              </Link>
              <button type="button" onClick={logout} className="label text-ink-soft hover:text-accent">
                Выйти
              </button>
            </Container>
          </header>
          <Container className="py-8 print:max-w-none print:p-0">{children}</Container>
        </div>
      </div>

      <div className="sm:hidden print:hidden">
        <header className="border-b border-line px-4">
          <div className="flex h-16 items-center justify-between">
            <span className="label-lg text-ink">[СВОБОДА]* CRM</span>
            <div className="flex items-center gap-3">
              <Link href="/admin/crm/review" className="relative rounded-lg p-2 text-ink-soft">
                <IconBell className="h-5 w-5" />
                {reviewCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium text-bg">
                    {reviewCount}
                  </span>
                )}
              </Link>
              <button type="button" onClick={logout} className="label text-ink-soft">
                Выйти
              </button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto pb-3">
            {MOBILE_TABS.map((tab) => {
              const active = tab.href === "/admin/crm" ? pathname === tab.href : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`pill label shrink-0 ${
                    active ? "bg-ink text-bg" : "text-ink-soft hover:bg-surface hover:text-ink"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
