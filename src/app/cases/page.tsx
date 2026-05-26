import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CasesPageContent } from "@/components/cases/CasesPageContent";
import { CtaBlock } from "@/components/pages/CtaBlock";
import { homeCopy } from "@/lib/copy";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Кейсы — Свобода Мерч",
  description: homeCopy.cases.sub,
};

export default function CasesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-[#f1f0eb]">
        <Container>
          <div className="relative min-h-[320px] py-8 md:min-h-[360px] md:py-10 lg:min-h-[300px] lg:py-12">
            <nav aria-label="Хлебные крошки" className="relative z-10">
              <ol className="flex items-center gap-2 text-xs text-muted">
                <li>
                  <Link href="/" className="hover:text-ink">
                    Главная
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-ink">Кейсы</li>
              </ol>
            </nav>
            <div className="relative z-10 mt-6 max-w-lg">
              <h1 className="font-heading text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
                {homeCopy.cases.title}
              </h1>
              <p className="mt-3 text-base text-muted">{homeCopy.cases.sub}</p>
            </div>
          </div>
        </Container>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] hidden lg:block">
          <Image
            src="/images/cases-hero.png"
            alt="Кейсы Свобода Мерч"
            fill
            priority
            className="object-cover object-center"
            sizes="45vw"
          />
          <div className="absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-[#f1f0eb] to-transparent" />
        </div>
      </section>
      <section className="bg-cream">
        <CasesPageContent />
      </section>
      <CtaBlock
        title="Хотите такой же результат?"
        body="Расскажите о задаче — предложим формат, носители и план запуска."
        button="Получить расчёт"
      />
    </>
  );
}
