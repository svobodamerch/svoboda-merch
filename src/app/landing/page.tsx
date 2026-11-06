import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LeadButton } from "@/components/ui/LeadButton";
import { siteContact, socialLinks } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Свобода Мерч — производство мерча в Москве и Новосибирске",
  description:
    "Своё производство в Москве и Новосибирске: рекламная продукция, пошив одежды, полиграфия и сувенирка от 1 штуки до тысяч единиц. Макет и визуализация бесплатно.",
  robots: { index: false },
};

// Лендинг для рассылки: коротко кто мы, где мы, что сделали.
// Фото кейсов — реальные кадры из рабочих чатов, без узнаваемых лиц.

const stats = [
  { value: "с 2016", label: "года шьём сами" },
  { value: "1–10 000", label: "штук в тираже" },
  { value: "7–14", label: "рабочих дней на тираж" },
];

const clients = ["Магнит", "Балтика", "Шкулёв Медиа", "Velvet Music", "ЦФТ", "2ГИС", "Кэмпы Павла Гительмана"];

const cases = [
  {
    client: "Энгиро",
    title: "Футболки «Динотерра»",
    desc: "Полноцветная печать на футболках для детского проекта и платки с фирменным паттерном.",
    images: ["dino-1", "dino-2", "engiro-scarf"],
  },
  {
    client: "Vadik's Duck Crew",
    title: "Кепки с вышивкой",
    desc: "Разработали вышивальные файлы под каждого персонажа и вышили кепки, панамы и футболки для команды.",
    images: ["duck-1", "duck-2", "duck-hoop"],
  },
  {
    client: "Федеральный бренд, под NDA",
    title: "Промо-набор для поп-ап зоны",
    desc: "Футболки, худи, леденцы и настольные игры в фирменном стиле: от макетов до упаковки.",
    images: ["promo-candy"],
  },
  {
    client: "Шкулёв Медиа · NGS.RU",
    title: "Мерч для «Летнего пикника»",
    desc: "Футболки, шоперы и кружки, которые гости покупали прямо на фестивале.",
    images: ["ngs-rack", "ngs-orange", "ngs-bag", "ngs-cups"],
  },
  {
    client: "Vision Club",
    title: "Мерч для тура на Сокотру",
    desc: "Футболки, банданы и наборы для участников, собрали и отправили к вылету.",
    images: ["vision-tees", "vision-box"],
  },
  {
    client: "ЦФТ",
    title: "Коллекция для ЦФТ Shop",
    desc: "Футболки, худи, рубашки и шапки для внутреннего магазина компании.",
    images: ["cft-hats", "cft-tee"],
  },
];

const directions = [
  { title: "Рекламная продукция и мерч", desc: "Футболки, худи, свитшоты, кепки, шоперы с логотипом. Вышивка, шелкография, ДТФ-печать." },
  { title: "Одежда под вашей маркой", desc: "Шьём по вашим лекалам или разрабатываем с нуля. Ваши бирки и упаковка." },
  { title: "Мероприятия", desc: "Баннеры, фотозоны, мерч для спикеров и раздатка: от эскиза до монтажа." },
  { title: "Полиграфия и сувенирка", desc: "Визитки, наклейки, буклеты, кружки, бутылки, блокноты, значки и нестандартные изделия под задачу." },
];

const steps = [
  "Рассказываете задачу: изделие, тираж, срок",
  "Бесплатно делаем макет и визуализацию",
  "Согласуем образец до запуска тиража",
  "Шьём и наносим за 7–14 рабочих дней",
  "Отправляем СДЭК, Почтой или самовывоз",
];

export default function LandingPage() {
  const tg = socialLinks.find((s) => s.label === "Telegram");
  const ig = socialLinks.find((s) => s.label === "Instagram");

  return (
    <>
      {/* ПЕРВЫЙ ЭКРАН */}
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-6">Москва · Новосибирск · с 2016</p>
          <h1 className="display text-ink mb-8" style={{ fontSize: "clamp(2.4rem, 8vw, 5.5rem)" }}>
            Шьём одежду.
            <br />
            Делаем мерч.
          </h1>
          <p className="max-w-xl text-ink-soft mb-10" style={{ fontSize: "1rem", lineHeight: 1.75 }}>
            Своё производство: рекламная продукция, пошив одежды, полиграфия и сувенирка.
            Работаем и с федеральными брендами, и с небольшими событиями: сто футболок к форуму
            или десять худи для команды. Макет и визуализацию делаем бесплатно.
          </p>
          <LeadButton className="pill label bg-accent text-bg !px-8 !py-4 hover:bg-accent-soft">
            Получить макет бесплатно
          </LeadButton>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="display text-ink" style={{ fontSize: "clamp(1.4rem, 4vw, 1.9rem)" }}>
                  {s.value}
                </p>
                <p className="label text-muted mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* КЛИЕНТЫ */}
      <section className="border-b border-line bg-surface">
        <Container className="py-10">
          <p className="label text-muted mb-5">Нам доверяют</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {clients.map((c) => (
              <span key={c} className="label-lg text-ink">
                {c}
              </span>
            ))}
          </div>
        </Container>
      </section>

      {/* КЕЙСЫ */}
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Что сделали</p>
          <h2 className="display text-ink mb-12" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Кейсы
          </h2>
          <div className="flex flex-col gap-16">
            {cases.map((c) => (
              <article key={c.title}>
                <p className="label text-muted mb-2">{c.client}</p>
                <h3 className="label-lg text-ink mb-2">{c.title}</h3>
                <p className="max-w-xl text-ink-soft mb-5" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                  {c.desc}
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {c.images.map((img) => (
                    <div key={img} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
                      <Image
                        src={`/images/landing/${img}.jpg`}
                        alt={`${c.client} — ${c.title}`}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 25vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* НАПРАВЛЕНИЯ */}
      <section className="border-b border-line bg-surface">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Что делаем</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {directions.map((d) => (
              <div key={d.title} className="rounded-2xl bg-bg p-6 md:p-7">
                <h3 className="label-lg text-ink mb-3">{d.title}</h3>
                <p className="text-ink-soft" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* КАК РАБОТАЕМ */}
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Как работаем</p>
          <ol className="grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => (
              <li key={s} className="rounded-2xl bg-surface p-5">
                <p className="display text-accent mb-3" style={{ fontSize: "1.4rem" }}>
                  0{i + 1}
                </p>
                <p className="text-ink-soft" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {s}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* КОНТАКТЫ */}
      <section className="bg-ink text-paper">
        <Container className="py-16 md:py-24">
          <h2 className="display mb-6" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Пришлите задачу — сделаем макет бесплатно
          </h2>
          <p className="max-w-xl text-paper/75 mb-10" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
            Производство в Москве и Новосибирске, доставляем по всей России.
          </p>
          <LeadButton className="pill label bg-accent text-bg !px-8 !py-4 hover:bg-accent-soft">
            Оставить заявку
          </LeadButton>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 label">
            <a href={siteContact.phoneHref}>{siteContact.phone}</a>
            <a href={siteContact.emailHref}>{siteContact.email}</a>
            {tg && <a href={tg.href}>Telegram</a>}
            {ig && <a href={ig.href}>Instagram {siteContact.site}</a>}
          </div>
        </Container>
      </section>
    </>
  );
}
