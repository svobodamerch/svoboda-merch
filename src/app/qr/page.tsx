import type { Metadata } from "next";
import { BirkaForm } from "@/components/ui/BirkaForm";
import { siteContact } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "[СВОБОДА]* — шьём одежду, печатаем мерч",
  description:
    "Шьём одежду, печатаем мерч, придумываем смыслы и идеи для людей и компаний. Тираж — от одной единицы.",
  robots: { index: true, follow: true },
};

export default function QrPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 md:px-6">
      {/* ПРИВЕТСТВИЕ */}
      <section className="pt-14 pb-10 md:pt-20">
        <p className="label text-accent mb-5">Вы отсканировали QR</p>
        <h1 className="display text-ink mb-6" style={{ fontSize: "clamp(2rem, 9vw, 3.4rem)" }}>
          [СВОБОДА]*
        </h1>
        <p className="text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
          Шьём одежду, печатаем мерч, придумываем смыслы и идеи для людей и
          компаний. Футболки, худи, рубашки, жилеты, головные уборы,
          аксессуары — тираж от одной единицы.
        </p>
      </section>

      {/* МАГАЗИН */}
      <section className="mb-14">
        <a
          href="/shop"
          className="block rounded-2xl bg-accent p-7 text-bg transition-colors hover:bg-accent-soft md:p-8"
        >
          <p className="label-lg mb-2">Магазин →</p>
          <p className="label leading-relaxed opacity-90">
            Готовые вещи из наличия — можно купить сразу, без тиража
          </p>
        </a>
      </section>

      {/* ЗАЯВКА */}
      <section className="mb-14">
        <p className="label text-accent mb-4">Нужен тираж для себя или компании?</p>
        <h2 className="display text-ink mb-4" style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}>
          Оставьте контакты
        </h2>
        <p className="text-ink-soft mb-7" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
          Посчитаем стоимость и сроки под ваш заказ — от одной вещи до крупной
          партии.
        </p>

        <BirkaForm source="qr" />
      </section>

      {/* КОНТАКТЫ */}
      <section className="border-t border-line py-12">
        <p className="label text-accent mb-6">Связаться напрямую</p>

        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <a href={siteContact.phoneHref} className="label text-ink-soft hover:text-accent">
            {siteContact.phone}
          </a>
          <a href={siteContact.emailHref} className="label text-ink-soft hover:text-accent">
            {siteContact.email}
          </a>
          <a
            href="https://t.me/svobodamerch"
            target="_blank"
            rel="noopener noreferrer"
            className="label text-ink-soft hover:text-accent"
          >
            @svobodamerch
          </a>
        </div>
      </section>
    </div>
  );
}
