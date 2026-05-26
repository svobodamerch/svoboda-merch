import Image from "next/image";
import Link from "next/link";
import { featuredCaseStudies } from "@/lib/cases";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CaseStudies() {
  return (
    <section id="cases" className="bg-ink py-24 text-paper md:py-32">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Кейсы"
            title="Проекты, которыми гордимся"
            description="Реальные задачи — от IT-онбординга до фестивальных дропов."
            dark
          />
          <Button
            href="/cases"
            variant="onDark"
            size="md"
            className="shrink-0 self-start md:self-auto"
          >
            Все кейсы
          </Button>
        </div>

        <div className="mt-16 space-y-6 lg:mt-20">
          {featuredCaseStudies.map((study, index) => (
            <article
              key={study.id}
              className="group grid overflow-hidden border border-paper/10 bg-paper/5 transition-colors hover:border-paper/20 md:grid-cols-12"
            >
              <div
                className={`relative aspect-[16/10] md:col-span-5 md:aspect-auto md:min-h-[320px] ${
                  index % 2 === 1 ? "md:order-2" : ""
                }`}
              >
                <Image
                  src={study.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 42vw"
                />
              </div>

              <div
                className={`flex flex-col justify-center p-8 md:col-span-7 md:p-12 lg:p-16 ${
                  index % 2 === 1 ? "md:order-1" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-paper/50">
                    {study.client}
                  </span>
                  <span className="inline-block border border-paper/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-paper/60">
                    {study.type}
                  </span>
                </div>
                <p className="mt-6 font-heading text-2xl font-medium leading-tight tracking-tight md:text-3xl">
                  {study.task}
                </p>
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="font-heading text-sm font-medium text-accent">
                    {study.metric}
                  </span>
                  <Link
                    href="/cases"
                    className="inline-flex items-center gap-2 text-sm text-paper transition-colors hover:text-accent"
                  >
                    Смотреть кейс
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
