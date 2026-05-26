import { Container } from "@/components/ui/Container";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="border-b border-line bg-cream pt-28 pb-14 md:pt-36 md:pb-20">
      <Container>
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-4 max-w-4xl font-heading text-4xl font-medium leading-tight tracking-tight text-ink text-balance md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
