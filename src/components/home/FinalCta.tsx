import { homeCopy } from "@/lib/copy";
import { ContactForm } from "@/components/home/ContactForm";
import { Container } from "@/components/ui/Container";

export function FinalCta() {
  const { finalCta } = homeCopy;
  return (
    <section id="contact" className="bg-surface py-16 md:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Контакты
            </p>
            <h2 className="mt-4 font-heading text-3xl font-medium leading-tight tracking-tight text-ink text-balance md:text-4xl lg:text-[2.75rem]">
              {finalCta.title}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted">
              {finalCta.body}
            </p>
            <p className="mt-6 text-sm text-muted">
              Чем подробнее опишете задачу — тем точнее будет расчёт и предложение
              по формату.
            </p>
          </div>
          <ContactForm />
        </div>
      </Container>
    </section>
  );
}
