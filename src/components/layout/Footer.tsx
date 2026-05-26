import Link from "next/link";
import { footerNav, siteContact, socialLinks } from "@/lib/navigation";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-14 md:py-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link
              href="/"
              className="font-heading text-xl font-semibold tracking-tight text-ink"
            >
              Свобода<span className="text-accent">.</span>Мерч
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Премиальный мерч для бизнеса, комьюнити и креаторов. Доставка по
              России.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {link.label}
                  {link.label === "Instagram" && (
                    <span className="ml-0.5 text-[10px] text-muted">*</span>
                  )}
                </Link>
              ))}
            </div>
            <p className="mt-2 max-w-xs text-[10px] leading-relaxed text-muted">
              * Instagram признан экстремистской организацией и запрещён на территории РФ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
                Продукция
              </p>
              <ul className="mt-4 space-y-2.5">
                {footerNav.products.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-soft hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
                Услуги
              </p>
              <ul className="mt-4 space-y-2.5">
                {footerNav.services.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-soft hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">
                Компания
              </p>
              <ul className="mt-4 space-y-2.5">
                {footerNav.company.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-ink-soft hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-6 space-y-2">
                <a
                  href={siteContact.phoneHref}
                  className="block text-sm font-medium text-ink hover:text-accent"
                >
                  {siteContact.phone}
                </a>
                <a
                  href={siteContact.emailHref}
                  className="block text-sm text-ink-soft hover:text-accent"
                >
                  {siteContact.email}
                </a>
                <a
                  href={siteContact.siteHref}
                  className="text-xs text-muted hover:text-accent"
                >
                  {siteContact.site}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-8 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Свобода Мерч</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-ink">
              Политика конфиденциальности
            </Link>
            <Link href="#" className="hover:text-ink">
              Оферта
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
