import Link from "next/link";
import { Container } from "@/components/ui/Container";

const legalLinks = [
  { href: "/legal/offer", label: "Публичная оферта" },
  { href: "/legal/requisites", label: "Реквизиты" },
  { href: "/legal/payment", label: "Оплата" },
  { href: "/legal/delivery", label: "Доставка и возврат" },
  { href: "/legal/privacy", label: "Конфиденциальность" },
  { href: "/legal/processing", label: "Обработка ПД" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-line bg-paper">
        <Container className="py-4">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted transition-colors hover:text-ink"
                style={{ fontWeight: 400 }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </Container>
      </div>
      <Container className="py-12 md:py-20">
        <div className="mx-auto max-w-3xl">{children}</div>
      </Container>
    </div>
  );
}
