import { Container } from "@/components/ui/Container";
import { siteContact, socialLinks } from "@/lib/navigation";

// ─── данные ────────────────────────────────────────────────────────────────

const stats = [
  { value: "8+", label: "лет в мерче" },
  { value: "500+", label: "проектов" },
  { value: "от 30", label: "единиц в тираже" },
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
  { title: "Гибкие тиражи", desc: "От пилотной партии до крупного заказа — масштабируем без потери качества." },
  { title: "Локальное производство", desc: "Новосибирск: контроль на каждом этапе, быстрые правки, прозрачный процесс." },
];

// Прайс — заглушка, заполним реальными данными
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
      <section className="relative overflow-hidden bg-ink py-24 md:py-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl"
        />
        <Container className="relative">
          <p className="mb-4 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Новосибирск · с 2016 года
          </p>
          <h1 className="mb-6 max-w-3xl font-heading text-4xl font-bold leading-[1.1] text-paper md:text-6xl lg:text-7xl">
            Мерч,{" "}
            <span className="text-accent">который хочется носить</span>
          </h1>
          <p className="mb-10 max-w-xl text-lg text-paper/70">
            Производим брендированную одежду и мерч для бизнеса, комьюнити
            и независимых проектов — от идеи до готового тиража.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href={siteContact.phoneHref}
              className="inline-flex h-14 items-center rounded-full bg-accent px-8 font-heading text-sm font-semibold text-paper transition-opacity hover:opacity-90"
            >
              Позвонить
            </a>
            <a
              href="https://t.me/svobodamerch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center rounded-full border border-paper/20 px-8 font-heading text-sm font-semibold text-paper transition-colors hover:bg-paper/10"
            >
              Написать в Telegram
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-paper/10 pt-10 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.value}>
                <p className="font-heading text-3xl font-bold text-paper">{s.value}</p>
                <p className="mt-1 text-sm text-paper/50">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* О НАС */}
      <section id="about" className="scroll-mt-24 py-20 md:py-28">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                О нас
              </p>
              <h2 className="mb-6 font-heading text-3xl font-bold leading-tight md:text-4xl">
                Студия брендированной одежды и мерча
              </h2>
              <p className="mb-4 text-muted">
                Мы не просто наносим логотип на футболку. Мы помогаем брендам,
                командам и сообществам говорить о себе через одежду — честно,
                стильно и без дешёвого вида.
              </p>
              <p className="text-muted">
                Производство в Новосибирске: собственные мощности, ответственность
                за каждый шов, прямой контакт с командой на всех этапах.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {why.map((w) => (
                <div key={w.title} className="rounded-2xl bg-surface p-6">
                  <p className="mb-2 font-heading text-sm font-semibold text-ink">{w.title}</p>
                  <p className="text-sm text-muted">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ЧТО ДЕЛАЕМ */}
      <section id="services" className="scroll-mt-24 bg-surface py-20 md:py-28">
        <Container>
          <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Что делаем
          </p>
          <h2 className="mb-12 font-heading text-3xl font-bold md:text-4xl">
            Направления работы
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div
                key={s.title}
                className="flex flex-col rounded-3xl bg-paper p-6 shadow-sm"
              >
                <span className="mb-4 inline-block self-start rounded-full bg-accent/10 px-3 py-1 font-heading text-xs font-semibold text-accent">
                  {s.tag}
                </span>
                <h3 className="mb-3 font-heading text-base font-semibold leading-snug text-ink">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ПРАЙС */}
      <section id="price" className="scroll-mt-24 py-20 md:py-28">
        <Container>
          <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Прайс
          </p>
          <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
            Ориентировочные цены
          </h2>
          <p className="mb-12 max-w-lg text-muted">
            Цены указаны за единицу при тираже от 30 шт. Финальная стоимость
            зависит от материала, нанесения и объёма — напишите нам для расчёта.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {priceCategories.map((cat) => (
              <div key={cat.name} className="rounded-3xl border border-line bg-paper p-6">
                <h3 className="mb-5 border-b border-line pb-4 font-heading text-lg font-semibold text-ink">
                  {cat.name}
                </h3>
                <ul className="space-y-4">
                  {cat.items.map((item) => (
                    <li key={item.name} className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-ink-soft">{item.name}</span>
                      <span className="shrink-0 font-heading text-sm font-semibold text-ink">
                        {item.from}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted">
            * Нанесение (печать, вышивка, ДТФ) рассчитывается отдельно.
            Минимальный тираж — 30 единиц.
          </p>
        </Container>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contact" className="scroll-mt-24 bg-ink py-20 md:py-28">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                Контакты
              </p>
              <h2 className="mb-6 font-heading text-3xl font-bold text-paper md:text-4xl">
                Обсудим ваш проект
              </h2>
              <p className="mb-10 text-paper/60">
                Расскажите задачу — ответим в течение часа и предложим варианты
                под ваш бюджет и сроки.
              </p>
              <div className="space-y-4">
                <a
                  href={siteContact.phoneHref}
                  className="flex items-center gap-3 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-sm">
                    📞
                  </span>
                  <span className="font-heading text-lg font-semibold">{siteContact.phone}</span>
                </a>
                <a
                  href={siteContact.emailHref}
                  className="flex items-center gap-3 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-sm">
                    ✉️
                  </span>
                  <span className="font-heading text-lg font-semibold">{siteContact.email}</span>
                </a>
                <a
                  href="https://t.me/svobodamerch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-paper transition-opacity hover:opacity-70"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper/10 text-sm">
                    💬
                  </span>
                  <span className="font-heading text-lg font-semibold">@svobodamerch</span>
                </a>
              </div>
            </div>
            <div className="rounded-3xl bg-paper/5 p-8">
              <p className="mb-6 font-heading text-sm font-semibold uppercase tracking-wider text-paper/50">
                Мы в соцсетях
              </p>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 items-center justify-center rounded-2xl border border-paper/10 font-heading text-sm font-semibold text-paper transition-colors hover:bg-paper/10"
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
