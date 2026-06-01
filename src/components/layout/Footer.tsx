import Link from "next/link";
import { siteContact, socialLinks } from "@/lib/navigation";
import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="py-10 md:py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="font-heading text-xl font-semibold tracking-tight text-ink"
            >
              Свобода<span className="text-accent">.</span>Мерч
            </Link>
            <p className="mt-2 text-sm text-muted">
              Премиальный мерч для бизнеса и комьюнити.<br />Новосибирск · Москва
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                {link.label}
                {link.label === "Instagram" && (
                  <span className="ml-0.5 text-[10px] text-muted">†</span>
                )}
              </a>
            ))}
          </div>

          <div className="space-y-1 text-sm">
            <a
              href={siteContact.phoneHref}
              className="block font-medium text-ink hover:text-accent"
            >
              {siteContact.phone}
            </a>
            <a
              href={siteContact.emailHref}
              className="block text-ink-soft hover:text-accent"
            >
              {siteContact.email}
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Свобода Мерч</p>
          <p>† Meta Platforms Inc. (Instagram, Facebook) признана экстремистской организацией и запрещена на территории Российской Федерации.</p>
        </div>
      </Container>
    </footer>
  );
}
