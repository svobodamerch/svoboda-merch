import type { Metadata } from "next";
import { PageHero } from "@/components/pages/PageHero";
import { faqPage } from "@/lib/copy";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "FAQ — Свобода Мерч",
  description: "Ответы на частые вопросы перед запуском мерча.",
};

export default function FaqPage() {
  return (
    <>
      <PageHero title={faqPage.hero.h1} />
      <section className="bg-cream py-12 md:py-20">
        <Container>
          <dl className="mx-auto max-w-3xl space-y-6">
            {faqPage.items.map((item) => (
              <div
                key={item.q}
                className="rounded-3xl border border-line bg-paper p-6 md:p-8"
              >
                <dt className="font-heading text-lg font-medium text-ink">
                  {item.q}
                </dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-12 text-center">
            <Button href="/#contact" variant="primary" size="lg">
              Получить расчёт
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
