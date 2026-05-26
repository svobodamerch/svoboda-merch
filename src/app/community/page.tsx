import type { Metadata } from "next";
import Image from "next/image";
import { CtaBlock } from "@/components/pages/CtaBlock";
import { PageHero } from "@/components/pages/PageHero";
import { communityPage } from "@/lib/copy";
import { images } from "@/lib/images";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Для комьюнити и креаторов — Свобода Мерч",
  description: communityPage.hero.sub,
};

export default function CommunityPage() {
  return (
    <>
      <PageHero title={communityPage.hero.h1} description={communityPage.hero.sub} />
      <section className="bg-cream py-12 md:py-16">
        <Container>
          <p className="mx-auto max-w-3xl text-center text-base leading-relaxed text-muted md:text-lg">
            {communityPage.intro}
          </p>
        </Container>
      </section>
      <section className="bg-paper py-12 md:py-16">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-medium md:text-3xl">
              {communityPage.what.title}
            </h2>
            <ul className="mt-6 space-y-3">
              {communityPage.what.items.map((item) => (
                <li key={item} className="text-base text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium md:text-3xl">
              {communityPage.important.title}
            </h2>
            <ul className="mt-6 space-y-3">
              {communityPage.important.items.map((item) => (
                <li key={item} className="text-base text-ink-soft">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
      <section className="bg-cream pb-12">
        <Container>
          <div className="relative mx-auto aspect-[21/9] max-w-4xl overflow-hidden rounded-3xl">
            <Image src={images.fashion} alt="" fill className="object-cover" sizes="100vw" />
          </div>
        </Container>
      </section>
      <CtaBlock
        title={communityPage.cta.title}
        body={communityPage.cta.body}
        button={communityPage.cta.button}
      />
    </>
  );
}
