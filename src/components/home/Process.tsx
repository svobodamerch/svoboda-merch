import { processSteps } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Process() {
  return (
    <section id="process" className="py-24 md:py-32">
      <Container>
        <SectionHeading
          eyebrow="Процесс"
          title="От брифа до доставки — пять шагов"
          description="Прозрачный путь без сюрпризов: вы всегда знаете, на каком этапе проект."
          align="center"
        />

        <ol className="mt-16 lg:mt-24">
          {processSteps.map((step) => (
            <li
              key={step.step}
              className="grid gap-6 border-t border-line py-10 md:grid-cols-12 md:items-start md:gap-8 md:py-12"
            >
              <span className="font-heading text-4xl font-medium text-line md:col-span-2 md:text-5xl">
                {step.step}
              </span>
              <div className="md:col-span-4">
                <h3 className="font-heading text-xl font-medium tracking-tight text-ink md:text-2xl">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted md:col-span-6 md:text-base">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
