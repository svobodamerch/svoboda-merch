import type { Metadata } from "next";
import Link from "next/link";
import { BirkaForm } from "@/components/ui/BirkaForm";
import { siteContact } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Уход за изделием — [СВОБОДА]*",
  description:
    "Как стирать, сушить и гладить одежду с принтом и вышивкой, чтобы она долго выглядела как новая. Плюс скидка на следующий заказ.",
  robots: { index: true, follow: true },
};

/** Основные правила — самое важное сверху */
const care = [
  {
    n: "30°",
    title: "Стирайте в тёплой воде",
    desc: "До 30 градусов, деликатный режим. Горячая вода садит хлопок и разрушает нанесение.",
  },
  {
    n: "↺",
    title: "Выворачивайте наизнанку",
    desc: "Так принт не тёрется о барабан и другие вещи. Молнии и кнопки застёгивайте.",
  },
  {
    n: "600",
    title: "Отжим на низких оборотах",
    desc: "До 600 об/мин. Сильный отжим заламывает принт и растягивает трикотаж.",
  },
  {
    n: "✕",
    title: "Без отбеливателя",
    desc: "Хлор и отбеливающие порошки выедают цвет ткани и краску нанесения.",
  },
  {
    n: "☁",
    title: "Не сушите в машине",
    desc: "Сушильная машина — главная причина, по которой вещь садится, а принт трескается.",
  },
  {
    n: "▭",
    title: "Сушите разложив",
    desc: "Трикотаж на плечиках вытягивается. Разложите горизонтально в тени, не на солнце.",
  },
];

const byPrint = [
  {
    title: "Принт: ДТФ и шелкография",
    rules: [
      "Не гладьте прямо по рисунку — только с изнанки",
      "Утюг на низкой температуре, без пара",
      "Первую стирку — через 24 часа после получения",
      "Не замачивайте надолго",
    ],
  },
  {
    title: "Вышивка",
    rules: [
      "Гладьте с изнанки через тонкую ткань",
      "Не тяните за нитки, если появилась затяжка — подрежьте ножницами",
      "Стирка в мешке для белья продлит вид",
      "Стойкая к стиркам, не выцветает",
    ],
  },
];

export default function BirkaPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 md:px-6">
      {/* ПРИВЕТСТВИЕ */}
      <section className="pt-14 pb-10 md:pt-20">
        <p className="label text-accent mb-5">Вы пришли с бирки</p>
        <h1 className="display text-ink mb-6" style={{ fontSize: "clamp(2rem, 9vw, 3.4rem)" }}>
          Спасибо,
          <br />
          что носите
        </h1>
        <p className="text-ink-soft" style={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
          Эту вещь сшили мы — в Новосибирске, своими руками. Ниже собрали всё,
          что нужно знать, чтобы она долго выглядела как новая.
        </p>
      </section>

      {/* СПЕЦПРЕДЛОЖЕНИЕ */}
      <section className="mb-14">
        <div className="rounded-2xl bg-tint p-7 md:p-8">
          <p className="label text-accent mb-4">Подарок за то, что заглянули</p>
          <p className="label-lg text-ink mb-3">−10% на следующий заказ</p>
          <p className="text-ink-soft mb-6" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
            Назовите менеджеру кодовое слово — и получите скидку на любой заказ
            в течение трёх месяцев. Работает и на тираж для компании,
            и на одну вещь для себя.
          </p>

          <div className="rounded-xl border border-dashed border-accent bg-bg px-5 py-4 text-center">
            <p className="label text-muted mb-1.5">Кодовое слово</p>
            <p className="label-lg text-accent" style={{ letterSpacing: "0.25em" }}>
              БИРКА
            </p>
          </div>
        </div>
      </section>

      {/* УХОД — ОСНОВНОЕ */}
      <section className="mb-14">
        <p className="label text-accent mb-4">Уход</p>
        <h2 className="display text-ink mb-8" style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}>
          Шесть правил
        </h2>

        <ul className="border-t border-line">
          {care.map((c) => (
            <li key={c.title} className="flex gap-5 border-b border-line py-5">
              <span
                className="label-lg shrink-0 text-accent"
                style={{ minWidth: "44px", paddingTop: "2px" }}
              >
                {c.n}
              </span>
              <span>
                <span className="label-lg text-ink block mb-2">{c.title}</span>
                <span
                  className="text-ink-soft block"
                  style={{ fontSize: "0.875rem", lineHeight: 1.7 }}
                >
                  {c.desc}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* УХОД ПО ТИПУ НАНЕСЕНИЯ */}
      <section className="mb-14">
        <p className="label text-accent mb-6">Зависит от нанесения</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {byPrint.map((b) => (
            <div key={b.title} className="rounded-2xl bg-surface p-6">
              <p className="label-lg text-ink mb-4">{b.title}</p>
              <ul className="space-y-2.5">
                {b.rules.map((r) => (
                  <li
                    key={r}
                    className="text-ink-soft flex gap-2.5"
                    style={{ fontSize: "0.85rem", lineHeight: 1.65 }}
                  >
                    <span className="shrink-0 text-accent">·</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="label text-muted mt-6 leading-relaxed">
          Если что-то пошло не так — принт отходит, шов расходится, — напишите нам.
          Разберёмся и переделаем.
        </p>
      </section>

      {/* ЗАЯВКА */}
      <section className="mb-14">
        <p className="label text-accent mb-4">Хотите такой же мерч?</p>
        <h2 className="display text-ink mb-4" style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}>
          Посчитаем ваш тираж
        </h2>
        <p className="text-ink-soft mb-7" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
          Шьём футболки, худи, рубашки, жилеты, головные уборы и аксессуары.
          Тираж — от одной единицы. Оставьте контакты, и мы посчитаем.
        </p>

        <BirkaForm />
      </section>

      {/* КУДА ДАЛЬШЕ */}
      <section className="border-t border-line py-12">
        <p className="label text-accent mb-6">Куда дальше</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="/shop"
            className="rounded-2xl bg-accent p-6 text-bg transition-colors hover:bg-accent-soft"
          >
            <p className="label-lg mb-2">Магазин →</p>
            <p className="label leading-relaxed opacity-90">
              Готовые вещи из наличия и база под ваш принт
            </p>
          </a>

          <Link
            href="/"
            className="rounded-2xl bg-surface p-6 transition-colors hover:bg-tint"
          >
            <p className="label-lg text-ink mb-2">О производстве →</p>
            <p className="label text-ink-soft leading-relaxed">
              Что шьём, прайс с тиражами и виды нанесения
            </p>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
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
