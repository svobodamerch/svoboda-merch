import Image from "next/image";
import { categoryGallery } from "@/lib/home-data";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CategoryGallery() {
  return (
    <section className="bg-paper py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Направления"
          title="Мерч для любой сцены"
          description="От хореки до айти-компаний — подбираем формат под вашу аудиторию."
        />
      </Container>

      <div className="scrollbar-hide mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 md:mt-14 md:gap-6 md:px-10 lg:px-[max(2.5rem,calc((100vw-1280px)/2+2.5rem))]">
        {categoryGallery.map((cat) => (
          <article
            key={cat.name}
            className="relative h-[320px] w-[min(75vw,280px)] shrink-0 snap-start overflow-hidden rounded-3xl md:h-[400px] md:w-[340px] lg:w-[380px]"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover"
              sizes="380px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
            <h3 className="absolute bottom-6 left-6 font-heading text-2xl font-medium text-paper">
              {cat.name}
            </h3>
          </article>
        ))}
      </div>
    </section>
  );
}
