import { homeCopy } from "@/lib/copy";
import { Container } from "@/components/ui/Container";

export function IntroBlock() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-medium leading-tight tracking-tight text-ink text-balance md:text-4xl lg:text-[2.75rem]">
            {homeCopy.intro.title}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
            {homeCopy.intro.body}
          </p>
        </div>
      </Container>
    </section>
  );
}
