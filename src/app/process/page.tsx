import type { Metadata } from "next";
import { PageHero } from "@/components/pages/PageHero";
import { processPage } from "@/lib/copy";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Как мы работаем — Свобода Мерч",
  description: processPage.hero.sub,
};

export default function ProcessPage() {
  return (
    <>
      <PageHero title={processPage.hero.h1} description={processPage.hero.sub} />
      <section className="bg-cream py-16 md:py-24">
        <Container>
          <ol className="mx-auto max-w-3xl space-y-0">
            {processPage.steps.map((step, index) => (
              <li
                key={step.title}
                className="grid gap-4 border-t border-line py-10 md:grid-cols-12 md:gap-8"
              >
                <span className="font-heading text-4xl font-medium text-line md:col-span-2">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-xl font-medium text-ink md:col-span-4 md:text-2xl">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted md:col-span-6 md:text-base">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-muted">
            {processPage.closing}
          </p>
        </Container>
      </section>
    </>
  );
}
