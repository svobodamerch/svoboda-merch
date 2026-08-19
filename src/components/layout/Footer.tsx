"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteContact, socialLinks } from "@/lib/navigation";
import { Container } from "@/components/ui/Container";

const legal = [
  { href: "/legal/offer", label: "Оферта" },
  { href: "/legal/requisites", label: "Реквизиты" },
  { href: "/legal/payment", label: "Оплата" },
  { href: "/legal/delivery", label: "Доставка и возврат" },
  { href: "/legal/privacy", label: "Конфиденциальность" },
  { href: "/legal/processing", label: "Обработка ПД" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/portal")) return null;

  return (
    <footer className="print:hidden border-t border-line bg-surface">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="label-lg text-ink">
              [СВОБОДА]<span className="text-accent">*</span>
            </Link>
            <p className="label text-muted mt-3 leading-relaxed">
              Шьём одежду
              <br />
              Печатаем мерч
              <br />
              Москва · Новосибирск
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="label text-muted mb-1">Связаться</p>
            <a href={siteContact.phoneHref} className="label text-ink-soft hover:text-accent">
              {siteContact.phone}
            </a>
            <a href={siteContact.emailHref} className="label text-ink-soft hover:text-accent">
              {siteContact.email}
            </a>
            <a
              href="https://t.me/svobodamerch"
              target="_blank"
              rel="noopener noreferrer"
              className="label text-ink-soft hover:text-accent"
            >
              @svobodamerch
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <p className="label text-muted mb-1">Соцсети</p>
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-ink-soft hover:text-accent"
              >
                {link.label}
                {link.label === "Instagram" && (
                  <span className="ml-0.5 text-[9px] text-muted">†</span>
                )}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="label text-muted mb-1">Документы</p>
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="label text-ink-soft hover:text-accent">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          <p className="label text-muted">
            © {new Date().getFullYear()} ИП Лялин А.С. · ИНН 543306833220
          </p>
          <p className="label text-muted max-w-md leading-relaxed">
            † Meta Platforms Inc. (Instagram, Facebook) признана экстремистской организацией
            и запрещена на территории Российской Федерации.
          </p>
        </div>
      </Container>
    </footer>
  );
}
