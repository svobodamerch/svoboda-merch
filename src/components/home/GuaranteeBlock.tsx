import Image from "next/image";
import { guaranteeChecks } from "@/lib/home-data";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function GuaranteeBlock() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-auto lg:min-h-[480px]">
            <Image
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&q=80"
              alt="Производство мерча"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <SectionHeading
              eyebrow="Гарантии"
              title="Работаем так, чтобы вам было спокойно"
              description="Прозрачный процесс, фиксированные условия и качество, которое видно с первого касания."
            />
            <ul className="mt-8 space-y-4">
              {guaranteeChecks.map((item) => (
                <li key={item} className="flex gap-3 text-sm md:text-base">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="text-ink-soft">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button href="/#contact" variant="primary" size="md">
                Получить расчёт
              </Button>
              <Button href="/#guide" variant="secondary" size="md">
                Скачать гайд
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
