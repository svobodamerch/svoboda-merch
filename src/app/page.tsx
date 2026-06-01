import { Container } from "@/components/ui/Container";
import { siteContact, socialLinks } from "@/lib/navigation";

// ─── данные ────────────────────────────────────────────────────────────────

const stats = [
  { value: "8+", label: "лет в мерче" },
  { value: "500+", label: "проектов" },
  { value: "от 1", label: "единицы в тираже" },
  { value: "14 дн", label: "средний срок" },
];

const services = [
  {
    tag: "B2B",
    title: "Корпоративный мерч",
    desc: "Одежда и аксессуары для команды, ивентов и HR-бренда — с характером, не «просто с логотипом».",
  },
  {
    tag: "Community",
    title: "Комьюнити и клубы",
    desc: "Коллекции для сообществ, фестивалей и локальных сцен — то, что люди носят сами.",
  },
  {
    tag: "Indie",
    title: "Независимые проекты",
    desc: "Малые тиражи для артистов, стартапов и брендов — от эскиза до партии без компромиссов.",
  },
  {
    tag: "Full cycle",
    title: "Полный цикл",
    desc: "Концепт, дизайн, ткани, производство и логистика — один партнёр на весь путь.",
  },
];

const why = [
  { title: "Дизайн, а не печать", desc: "Сначала идея и визуальный язык — потом носитель. Мерч как часть бренда." },
  { title: "Премиальные материалы", desc: "Ткани и фурнитура уровня streetwear: плотный хлопок, аккуратные швы." },
  { title: "Гибкие тиражи", desc: "От 1 до крупного заказа — масштабируем без потери качества." },
  { title: "Локальное производство", desc: "Новосибирск · Москва: контроль на каждом этапе, прозрачный процесс." },
];

const priceCategories = [
  {
    name: "Футболки",
    items: [
      { name: "Базовая (180 г/м²)", from: "от 590 ₽" },
      { name: "Heavyweight (240 г/м²)", from: "от 890 ₽" },
      { name: "Оверсайз", from: "от 990 ₽" },
    ],
  },
  {
    name: "Худи и свитшоты",
    items: [
      { name: "Свитшот crewneck", from: "от 1 490 ₽" },
      { name: "Худи с капюшоном", from: "от 1 790 ₽" },
      { name: "Оверсайз худи", from: "от 1 990 ₽" },
    ],
  },
  {
    name: "Аксессуары",
    items: [
      { name: "Шоппер", from: "от 390 ₽" },
      { name: "Кепка", from: "от 690 ₽" },
      { name: "Носки", from: "от 290 ₽" },
    ],
  },
];

// ─── страница ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink py-28 md:py-40">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-0 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl"
        />
        <Container className="relative">
          {/* надлинейник */}
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.25em] text-accent"
            style={{ fontWeight: 500 }}
          >
            Новосибирск · Москва · с 2016 года
          </p>

          {/* главный заголовок — Gerbera Light 300 */}
          <h1
            className="mb-8 max-w-4xl text-paper"
            style={{
              fontWeight: 300,
              fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Мерч,{" "}
            <span style={{ color: "var(--color-accent)" }}>
              который хочется носить
            </span>
          </h1>

          <p
            className="mb-10 max-w-lg text-paper/60"
            style={{ fontWeight: 400, fontSize: "1.1rem", lineHeight: 1.65 }}
          >
            Производим брендированную одежду и мерч для бизнеса, комьюнити
            и независимых проектов — от идеи до готового тиража.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={siteContact.phoneHref}
              className="inline-flex h-14 items-center rounded-full bg-accent px-8 text-paper transition-opacity hover:opacity-85"
              style={{ fontWeight: 500, fontSize: "0.9rem", letterSpacing: "0.02em" }}
            >
              Позвонить
            </a>
            <a
              href="https://t.me/svobodamerch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center rounded-full border border-paper/20 px-8 text-paper transition-colors hover:bg-paper/10"
              style={{ fontWeight: 400, fontSize: "0.9rem", letterSpacing: "0.02em" }}
            >
              Написать в Telegram
            </a>
          </div>

          {/* stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-paper/10 pt-10 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.value}>
                <p
                  className="text-paper"
                  style={{ fontWeight: 300, fontSize: "2.2rem", letterSpacing: "-0.02em", lineHeight: 1 }}
                >
                  {s.value}
                </p>
                <p className="mt-1.5 text-sm text-paper/40" style={{ fontWeight: 400 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* О НАС */}
      <section id="about" className="scroll-mt-24 py-20 md:py-28">
        <Container>
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <p
                className="mb-4 text-xs uppercase tracking-[0.25em] text-accent"
                style={{ fontWeight: 500 }}
              >
                О нас
              </p>
              <h2
                className="mb-6 text-ink"
                style={{ fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 1.15 }}
              >
                Студия брендированной одежды и мерча
              </h2>
              <p className="mb-4 text-muted" style={{ fontWeight: 400, lineHeight: 1.7 }}>
                Мы не просто наносим логотип на футболку. Мы помогаем брендам,
                командам и сообществам говорить о себе через одежду — честно,
                стильно и без дешёвого вида.
              </p>
              <p className="text-muted" style={{ fontWeight: 400, lineHeight: 1.7 }}>
                Производство в Новосибирске, шоурум в Москве: собственные мощности,
                ответственность за каждый шов, прямой контакт на всех этапах.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {why.map((w) => (
                <div key={w.title} className="rounded-2xl bg-surface p-6">
                  <p className="mb-2 text-ink" style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                    {w.title}
                  </p>
                  <p className="text-muted" style={{ fontWeight: 400, fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {w.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ЧТО ДЕЛАЕМ */}
      <section id="services" className="scroll-mt-24 bg-surface py-20 md:py-28">
        <Container>
          <p
            className="mb-4 text-xs uppercase tracking-[0.25em] text-accent"
            style={{ fontWeight: 500 }}
          >
            Что делаем
          </p>
          <h2
            className="mb-12 text-ink"
            style={{ fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Направления работы
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="flex flex-col rounded-3xl bg-paper p-7"
              >
                <span
                  className="mb-5 inline-block self-start rounded-full bg-accent/10 px-3 py-1 text-accent"
                  style={{ fontWeight: 500, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                >
                  {s.tag}
                </span>
                <h3
                  className="mb-3 text-ink"
                  style={{ fontWeight: 500, fontSize: "1rem", lineHeight: 1.3 }}
                >
                  {s.title}
                </h3>
                <p className="text-muted" style={{ fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ПРАЙС */}
      <section id="price" className="scroll-mt-24 py-20 md:py-28">
        <Container>
          <p
            className="mb-4 text-xs uppercase tracking-[0.25em] text-accent"
            style={{ fontWeight: 500 }}
          >
            Прайс
          </p>
          <h2
            className="mb-4 text-ink"
            style={{ fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
          >
            Ориентировочные цены
          </h2>
          <p className="mb-12 max-w-lg text-muted" style={{ fontWeight: 400, lineHeight: 1.7 }}>
            Цены указаны за единицу. Тираж — от 1 единицы. Финальная стоимость
            зависит от материала, нанесения и объёма — напишите нам для расчёта.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {priceCategories.map((cat) => (
              <div key={cat.name} className="rounded-3xl border border-line bg-paper p-7">
                <h3
                  className="mb-5 border-b border-line pb-4 text-ink"
                  style={{ fontWeight: 600, fontSize: "1rem", letterSpacing: "0.01em" }}
                >
                  {cat.name}
                </h3>
                <ul className="space-y-4">
                  {cat.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <span className="text-ink-soft" style={{ fontWeight: 400, fontSize: "0.875rem" }}>
                        {item.name}
                      </span>
                      <span className="shrink-0 text-ink" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {item.from}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-muted" style={{ fontWeight: 400, fontSize: "0.8rem" }}>
            * Нанесение (печать, вышивка, ДТФ) рассчитывается отдельно. Минимальный тираж — от 1 единицы.
          </p>
        </Container>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contact" className="scroll-mt-24 bg-ink py-20 md:py-28">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p
                className="mb-4 text-xs uppercase tracking-[0.25em] text-accent"
                style={{ fontWeight: 500 }}
              >
                Контакты
              </p>
              <h2
                className="mb-6 text-paper"
                style={{ fontWeight: 300, fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}
              >
                Обсудим ваш проект
              </h2>
              <p className="mb-10 text-paper/50" style={{ fontWeight: 400, lineHeight: 1.7 }}>
                Расскажите задачу — ответим в течение часа и предложим варианты
                под ваш бюджет и сроки.
              </p>
              <div className="space-y-5">
                <a
                  href={siteContact.phoneHref}
                  className="flex items-center gap-4 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper/10 text-base">
                    📞
                  </span>
                  <span style={{ fontWeight: 500, fontSize: "1.1rem" }}>{siteContact.phone}</span>
                </a>
                <a
                  href={siteContact.emailHref}
                  className="flex items-center gap-4 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper/10 text-base">
                    ✉️
                  </span>
                  <span style={{ fontWeight: 400, fontSize: "1.1rem" }}>{siteContact.email}</span>
                </a>
                <a
                  href="https://t.me/svobodamerch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper/10 text-base">
                    💬
                  </span>
                  <span style={{ fontWeight: 400, fontSize: "1.1rem" }}>@svobodamerch</span>
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-paper/5 p-8">
              <p
                className="mb-6 uppercase tracking-[0.2em] text-paper/40"
                style={{ fontWeight: 500, fontSize: "0.7rem" }}
              >
                Мы в соцсетях
              </p>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 items-center justify-center rounded-2xl border border-paper/10 text-paper transition-colors hover:bg-paper/10"
                    style={{ fontWeight: 500, fontSize: "0.875rem" }}
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
