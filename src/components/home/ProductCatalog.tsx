"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { homeCopy } from "@/lib/copy";
import {
  productCategories,
  products,
  type ProductCategory,
} from "@/lib/home-data";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-xs text-accent" aria-label={`${rating} из 5`}>
      ★ {rating.toFixed(1)}
    </span>
  );
}

export function ProductCatalog({ showHeader = true }: { showHeader?: boolean }) {
  const [active, setActive] = useState<ProductCategory>("Футболки");
  const filtered = useMemo(
    () => products.filter((p) => p.category === active),
    [active],
  );

  return (
    <section id="catalog" className="bg-paper py-16 md:py-24">
      <Container>
        {showHeader && (
          <>
            <SectionHeading
              eyebrow="Каталог"
              title={homeCopy.catalog.title}
              description={homeCopy.catalog.sub}
            />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted md:text-base">
              {homeCopy.catalog.intro}
            </p>
          </>
        )}

        <div
          className="scrollbar-hide -mx-6 mt-10 flex gap-8 overflow-x-auto border-b border-line px-6 md:mx-0 md:justify-between md:overflow-visible md:px-0"
          role="tablist"
        >
          {productCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active === cat}
              onClick={() => setActive(cat)}
              className={`shrink-0 border-b-2 px-1 pb-4 text-sm font-medium transition-all ${
                active === cat
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="group bg-paper"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs text-muted">{product.brand}</p>
                  <Stars rating={product.rating} />
                </div>
                <h3 className="mt-1 font-heading text-base font-medium text-ink md:text-lg">
                  {product.name}
                </h3>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button href="/#contact" variant="secondary" size="md">
            Получить подборку
          </Button>
        </div>
      </Container>
    </section>
  );
}
