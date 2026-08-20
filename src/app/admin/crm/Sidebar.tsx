"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconDashboard,
  IconDeals,
  IconTasks,
  IconContacts,
  IconMoney,
  IconChevron,
  IconCollapse,
  IconPromise,
  IconCalendar,
  IconDay,
} from "./nav-icons";

type Leaf = { href: string; label: string };
type NavItem =
  | { type: "link"; href: string; label: string; icon: (p: { className?: string }) => React.JSX.Element }
  | { type: "group"; label: string; icon: (p: { className?: string }) => React.JSX.Element; children: Leaf[] };

const NAV: NavItem[] = [
  { type: "link", href: "/admin/crm", label: "Дашборд", icon: IconDashboard },
  { type: "link", href: "/admin/crm/calendar", label: "Календарь", icon: IconCalendar },
  { type: "link", href: "/admin/crm/day", label: "Итог дня", icon: IconDay },
  {
    type: "group",
    label: "Сделки",
    icon: IconDeals,
    children: [
      { href: "/admin/crm/orders", label: "Канбан" },
      { href: "/admin/crm/pipeline", label: "Воронка" },
      { href: "/admin/crm/proposals", label: "КП" },
      { href: "/admin/crm/knowledge", label: "База знаний" },
    ],
  },
  { type: "link", href: "/admin/crm/tasks", label: "Задачи", icon: IconTasks },
  { type: "link", href: "/admin/crm/commitments", label: "Обещания", icon: IconPromise },
  {
    type: "group",
    label: "Контрагенты",
    icon: IconContacts,
    children: [
      { href: "/admin/crm/contractors", label: "Контрагенты" },
      { href: "/admin/crm/products", label: "Товары" },
    ],
  },
  {
    type: "group",
    label: "Деньги",
    icon: IconMoney,
    children: [
      { href: "/admin/crm/payments", label: "Движение денег" },
      { href: "/admin/crm/expenses", label: "Расходы" },
      { href: "/admin/crm/cash", label: "Прогноз кассы" },
      { href: "/admin/crm/reconciliation", label: "Сверка" },
      { href: "/admin/crm/documents", label: "Документы" },
      { href: "/admin/crm/legal-entities", label: "Юрлица" },
    ],
  },
];

const COLLAPSE_KEY = "crm-sidebar-collapsed";

const isActive = (pathname: string, href: string) =>
  href === "/admin/crm" ? pathname === href : pathname === href || pathname.startsWith(href + "/");

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    // группа, где лежит текущая страница, раскрыта сама
    const active = NAV.find((item) => item.type === "group" && item.children.some((c) => isActive(pathname, c.href)));
    if (active) setOpenGroup(active.label);
  }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
  };

  // до гидратации показываем развёрнутый вариант — без мигания layout на клиенте это не критично
  const showCollapsed = hydrated && collapsed;

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-150 ${
        showCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`flex h-16 items-center border-b border-line ${showCollapsed ? "justify-center px-0" : "justify-between px-5"}`}>
        {!showCollapsed && <span className="label-lg text-ink">[СВОБОДА]*</span>}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-lg p-1.5 text-muted hover:bg-tint hover:text-ink"
          title={showCollapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          <IconCollapse className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          if (item.type === "link") {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={showCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 label ${
                  active ? "bg-ink text-bg" : "text-ink-soft hover:bg-tint hover:text-ink"
                } ${showCollapsed ? "justify-center px-0" : ""}`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!showCollapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          const groupActive = item.children.some((c) => isActive(pathname, c.href));
          const open = openGroup === item.label;

          if (showCollapsed) {
            return (
              <Link
                key={item.label}
                href={item.children[0].href}
                title={item.label}
                className={`flex items-center justify-center rounded-xl px-0 py-2.5 label ${
                  groupActive ? "bg-ink text-bg" : "text-ink-soft hover:bg-tint hover:text-ink"
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => setOpenGroup(open ? null : item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 label ${
                  groupActive && !open ? "bg-tint text-ink" : "text-ink-soft hover:bg-tint hover:text-ink"
                }`}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <IconChevron className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>
              {open && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-line pl-3">
                  {item.children.map((c) => {
                    const active = isActive(pathname, c.href);
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`block rounded-lg px-3 py-2 label ${
                          active ? "text-accent" : "text-ink-soft hover:text-ink"
                        }`}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
