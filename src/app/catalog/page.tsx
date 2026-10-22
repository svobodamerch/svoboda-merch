import type { Metadata } from "next";
import { ProductCatalog } from "@/components/home/ProductCatalog";
import { PageHero } from "@/components/pages/PageHero";
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
      <ProductCatalog showHeader={false} />
    </>
  );
}
