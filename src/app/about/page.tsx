import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/pages/PageHero";
import { aboutPage } from "@/lib/copy";
import { images } from "@/lib/images";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "О нас — Свобода Мерч",
  description: aboutPage.hero.sub,
};

export default function AboutPage() {
  return (
    <>
      <PageHero title={aboutPage.hero.h1} description={aboutPage.hero.sub} />
      <section className="bg-cream py-12 md:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <p className="text-base leading-relaxed text-muted md:text-lg">
              {aboutPage.intro}
            </p>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src={images.studio} alt="" fill className="object-cover" sizes="50vw" />
            </div>
          </div>
        </Container>
      </section>
      <section className="bg-paper py-12 md:py-16">
        <Container>
          <h2 className="font-heading text-2xl font-medium md:text-3xl">
            {aboutPage.philosophy.title}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {aboutPage.philosophy.items.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-line bg-cream px-6 py-5 font-medium text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-12 max-w-2xl text-center text-base leading-relaxed text-muted">
            {aboutPage.closing}
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button href="/cases" variant="secondary" size="md">
              Смотреть кейсы
            </Button>
            <Button href="/#contact" variant="primary" size="md">
              Начать проект
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
