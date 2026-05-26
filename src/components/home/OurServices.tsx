import Image from "next/image";
import { services } from "@/lib/home-data";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function OurServices() {
  return (
    <section id="services" className="bg-paper py-16 md:py-24">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Услуги"
            title="Печать, вышивка и кастомизация"
            description="Подбираем технологию под тираж, ткань и задачу — без ощущения типографии."
          />
          <Button href="/production" variant="secondary" size="md" className="shrink-0 self-start md:self-auto">
            Производство и материалы
          </Button>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16">
          {services.map((service) => (
            <article
              key={service.title}
              className="group overflow-hidden rounded-3xl bg-cream"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-6 md:p-8">
                <h3 className="font-heading text-xl font-medium text-ink md:text-2xl">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                  {service.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
