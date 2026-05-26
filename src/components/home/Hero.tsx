import Image from "next/image";
import { homeCopy } from "@/lib/copy";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  const { hero } = homeCopy;
  return (
    <section className="relative overflow-hidden bg-[#f1f0eb]">
      <Container>
        <div className="relative min-h-[320px] py-6 md:min-h-[340px] md:py-8 lg:min-h-[280px] lg:py-10">
          <div className="relative z-10 max-w-md">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Свобода Мерч
            </p>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-muted">
              @svoboda.site — 10 лет создаём смыслы
            </p>
            <h1 className="mt-5 font-heading text-[2rem] font-medium leading-[1.05] tracking-tight text-balance sm:text-4xl lg:text-[3.25rem]">
              {hero.h1}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted md:text-base">
              {hero.sub}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/cases" variant="primary" size="lg">
                {hero.cta1}
              </Button>
              <Button href="/#contact" variant="secondary" size="lg">
                {hero.cta2}
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <div className="pointer-events-none absolute inset-y-0 right-0 w-[50%] hidden lg:block">
        <Image
          src="/images/image.png"
          alt="Премиальный мерч Свобода Мерч"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-[#f1f0eb] to-transparent" />
      </div>

      <div className="pointer-events-none relative -mt-10 h-[300px] w-full lg:hidden">
        <Image
          src="/images/image.png"
          alt="Премиальный мерч Свобода Мерч"
          fill
          priority
          className="object-cover object-top"
          sizes="100vw"
        />
      </div>
    </section>
  );
}
