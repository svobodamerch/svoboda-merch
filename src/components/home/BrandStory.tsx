import Image from "next/image";
import Link from "next/link";
import { brandStory } from "@/lib/home-data";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function BrandStory() {
  return (
    <section id="story" className="bg-cream py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:min-h-[440px]">
            <Image
              src={brandStory.image}
              alt="История бренда Свобода Мерч"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              История
            </p>
            <blockquote className="mt-6 font-heading text-2xl font-medium leading-snug tracking-tight text-ink md:text-3xl lg:text-[2rem]">
              &ldquo;{brandStory.quote}&rdquo;
            </blockquote>
            <cite className="mt-6 block text-sm not-italic text-muted">
              — {brandStory.author}
            </cite>
            <Button href="/about" variant="secondary" size="md" className="mt-8">
              Читать историю
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
