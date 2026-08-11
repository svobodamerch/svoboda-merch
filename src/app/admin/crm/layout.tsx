"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { Container } from "@/components/ui/Container";

const tabs = [
  { href: "/admin/crm", label: "Дашборд" },
  { href: "/admin/crm/orders", label: "Заказы" },
  { href: "/admin/crm/contractors", label: "Контрагенты" },
  { href: "/admin/crm/payments", label: "Деньги" },
];

export default function CrmLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/crm/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

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
                    {tab.label}
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
                {tab.label}
              </Link>
            );
          })}
        </Container>
      </header>

      <Container className="py-8">{children}</Container>
    </div>
  );
}
