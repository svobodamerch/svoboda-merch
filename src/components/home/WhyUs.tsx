import Image from "next/image";
import { homeCopy } from "@/lib/copy";
import { whyUsItems } from "@/lib/home-data";
import { images } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function WhyUs() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:min-h-[390px]">
            <Image
              src={images.team}
              alt={homeCopy.whyUs.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <h2 className="font-heading text-3xl font-medium leading-tight tracking-tight text-ink text-balance md:text-4xl lg:text-[2.75rem]">
              {homeCopy.whyUs.title}
            </h2>
            <ul className="mt-7 grid gap-3">
              {whyUsItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted md:text-base">
                  <span className="mt-0.5 text-ink" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/#contact" variant="primary" size="md">
                Обсудить идею
              </Button>
              <Button href="/cases" variant="ghost" size="md">
                Посмотреть проекты →
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
