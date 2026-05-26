import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/pages/PageHero";
import { productionPage } from "@/lib/copy";
import { images } from "@/lib/images";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

const blockImages = [
  images.print,
  images.embroidery,
  images.custom,
  images.packaging,
  images.studio,
];

export const metadata: Metadata = {
  title: "Производство и материалы — Свобода Мерч",
  description: productionPage.hero.sub,
};

export default function ProductionPage() {
  return (
    <>
      <PageHero title={productionPage.hero.h1} description={productionPage.hero.sub} />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-muted md:text-lg">
            {productionPage.intro}
          </p>
        </Container>
      </section>
      <section className="bg-paper py-12 md:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productionPage.blocks.map((block, i) => (
              <article key={block.title} className="overflow-hidden rounded-3xl bg-cream">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={blockImages[i] ?? images.studio}
                    alt={block.title}
                    fill
                    className="object-cover"
                    sizes="33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-lg font-medium text-ink">
                    {block.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{block.description}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <h2 className="font-heading text-2xl font-medium md:text-3xl">
            {productionPage.quality.title}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {productionPage.quality.items.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-line bg-paper p-5 text-ink-soft"
              >
                <span className="text-accent" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Button href="/#contact" variant="primary" size="lg">
              Получить расчёт
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
