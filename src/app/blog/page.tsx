import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Блог — Свобода Мерч",
  description: "Статьи о мерче, брендинге и производстве одежды.",
};

export default function BlogPage() {
  return (
    <section className="bg-cream py-28 md:py-36">
      <Container className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Скоро
        </p>
        <h1 className="mt-4 font-heading text-4xl font-medium text-ink md:text-5xl">
          Блог в разработке
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Делимся опытом о мерче, тканях и кейсах — первая статья уже на подходе.
        </p>
        <Button href="/" variant="secondary" size="md" className="mt-8">
          На главную
        </Button>
      </Container>
    </section>
  );
}
