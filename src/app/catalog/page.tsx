import type { Metadata } from "next";
import { ProductCatalog } from "@/components/home/ProductCatalog";
import { PageHero } from "@/components/pages/PageHero";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { homeCopy } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Каталог — Свобода Мерч",
  description: homeCopy.catalog.sub,
};

export default function CatalogPage() {
  return (
    <>
      <PageHero
        eyebrow="Коллекции"
        title={homeCopy.catalog.title}
        description={homeCopy.catalog.intro}
      />
      <section className="bg-paper pb-16 pt-2 md:pb-20">
        <Container className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="label-lg text-ink">Хотите собрать свой принт прямо сейчас?</p>
            <p className="mt-1 text-sm text-muted">
              Добавьте текст или фото на футболку в конструкторе — пришлём цену за тираж.
            </p>
          </div>
          <Button href="/constructor" variant="primary" size="md">
            Открыть конструктор
          </Button>
        </Container>
      </section>
      <ProductCatalog showHeader={false} />
    </>
  );
}
