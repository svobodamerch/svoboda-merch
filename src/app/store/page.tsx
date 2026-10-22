import type { Metadata } from "next";
import { PageHero } from "@/components/pages/PageHero";
import { Container } from "@/components/ui/Container";
import { LeadButton } from "@/components/ui/LeadButton";

export const metadata: Metadata = {
  title: "Магазин — Свобода Мерч",
  description: "Магазин на этапе разработки. Заказы принимаем напрямую.",
  robots: { index: false },
};

export default function StorePage() {
  return (
    <>
      <PageHero
        eyebrow="Магазин"
        title="Магазин на этапе разработки"
        description="Скоро откроем. А пока принимаем заказы напрямую: мерч, рекламная продукция и event-проекты, небольшие тиражи, при необходимости срочно."
      />
      <section className="bg-paper pb-16 pt-2 md:pb-20">
        <Container>
          <LeadButton className="pill label bg-accent text-bg !px-8 !py-4 hover:bg-accent-soft">
            Оставить заявку
          </LeadButton>
        </Container>
      </section>
    </>
  );
}
