import { philosophyQuote } from "@/lib/home-data";
import { Container } from "@/components/ui/Container";

export function BrandPhilosophy() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container>
        <blockquote className="mx-auto max-w-4xl text-center">
          <p className="font-heading text-2xl font-medium leading-snug tracking-tight text-ink text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            &ldquo;{philosophyQuote}&rdquo;
          </p>
          <footer className="mt-8 text-sm text-muted">— Философия Свобода Мерч</footer>
        </blockquote>
      </Container>
    </section>
  );
}
