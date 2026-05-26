import Image from "next/image";
import { featuredProducts } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FeaturedCollection() {
  return (
    <section id="collection" className="py-24 md:py-32">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Коллекция"
            title="Изделия, с которых начинается разговор"
            description="Премиальные носители под ваш бренд — от базовых футболок до капсульных коллекций."
          />
          <Button href="#contact" variant="secondary" size="md" className="shrink-0 self-start md:self-auto">
            Запросить каталог
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 lg:mt-20">
          {featuredProducts.map((product) => (
            <article
              key={product.name}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/10" />
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.15em] text-muted">
                  {product.category}
                </p>
                <h3 className="mt-1 text-sm font-medium text-ink md:text-base">
                  {product.name}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
