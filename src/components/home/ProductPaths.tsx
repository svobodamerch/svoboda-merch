import Link from "next/link";
import Image from "next/image";
import { homeCopy } from "@/lib/copy";
import { productPaths } from "@/lib/home-data";
import { images } from "@/lib/images";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const productPathImages = [images.team, images.fashion, images.hoodie, images.gifts] as const;

export function ProductPaths() {
  return (
    <section id="directions" className="bg-cream py-14 md:py-20">
      <Container>
        <SectionHeading title={homeCopy.productPaths.title} align="center" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {productPaths.map((path, index) => (
            <Link
              key={path.title}
              href={path.href}
              className="group relative min-h-[320px] overflow-hidden rounded-3xl bg-paper shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <Image
                src={productPathImages[index]}
                alt={path.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-paper">
                <h3 className="font-heading text-2xl font-medium tracking-tight">
                  {path.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-paper/80">
                  {path.description}
                </p>
                <span className="mt-5 inline-flex rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink">
                  Подробнее
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
