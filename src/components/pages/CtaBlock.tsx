import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type CtaBlockProps = {
  title: string;
  body: string;
  button: string;
  href?: string;
};

export function CtaBlock({
  title,
  body,
  button,
  href = "/#contact",
}: CtaBlockProps) {
  return (
    <section className="bg-ink py-16 text-paper md:py-20">
      <Container className="text-center">
        <h2 className="font-heading text-2xl font-medium tracking-tight md:text-3xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-paper/75 md:text-base">
          {body}
        </p>
        <Button href={href} variant="onDark" size="lg" className="mt-8">
          {button}
        </Button>
      </Container>
    </section>
  );
}
