import type { Metadata } from "next";
import Image from "next/image";
import { CtaBlock } from "@/components/pages/CtaBlock";
import { PageHero } from "@/components/pages/PageHero";
import { businessPage } from "@/lib/copy";
import { images } from "@/lib/images";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Для бизнеса — Свобода Мерч",
  description: businessPage.hero.sub,
};

export default function BusinessPage() {
  return (
    <>
      <PageHero title={businessPage.hero.h1} description={businessPage.hero.sub} />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <p className="text-base leading-relaxed text-muted md:text-lg">
              {businessPage.intro}
            </p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src={images.office} alt="" fill className="object-cover" sizes="50vw" />
            </div>
          </div>
        </Container>
      </section>
      <section className="bg-paper py-12 md:py-16">
        <Container>
          <h2 className="font-heading text-2xl font-medium md:text-3xl">
            {businessPage.tasks.title}
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {businessPage.tasks.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-line bg-cream px-5 py-4 text-sm text-ink-soft md:text-base"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <h2 className="font-heading text-2xl font-medium md:text-3xl">
            {businessPage.why.title}
          </h2>
          <ul className="mt-8 space-y-4">
            {businessPage.why.items.map((item) => (
              <li key={item} className="flex gap-3 text-base text-ink-soft">
                <span className="text-accent" aria-hidden>
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <CtaBlock
        title={businessPage.cta.title}
        body={businessPage.cta.body}
        button={businessPage.cta.button}
      />
    </>
  );
}
