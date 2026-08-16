import { Container } from "@/components/ui/Container";
import { LeadButton } from "@/components/ui/LeadButton";
import { AssortmentGallery } from "@/components/home/AssortmentGallery";
import { HeroReels } from "@/components/home/HeroReels";
import { VideoStrip } from "@/components/home/VideoStrip";
import { ProductionCarousel } from "@/components/home/ProductionCarousel";
import { PriceList } from "@/components/home/PriceList";
import { siteContact, socialLinks } from "@/lib/navigation";
import { getSiteMedia } from "@/lib/media";
import { JsonLd, catalogSchema, faqSchema } from "@/lib/seo";
import { clothing, accessories } from "@/lib/priceCatalog";

// ─── данные из коммерческого предложения ───────────────────────────────────

const stats = [
  { value: "с 2016", label: "года на рынке" },
  { value: "100+", label: "моделей и вариантов мерча" },
  { value: "7–14", label: "дней производство тиража" },
];

/** Одежда собственного пошива */
const clothingLine = [
  "Футболки",
  "Рубашки",
  "Лонгсливы",
  "Свитшоты",
  "Толстовки и худи",
  "Жилеты",
  "Головные уборы",
];

/** Сувенирка: часть по каталогам поставщиков, часть — кастом под задачу */
const souvenirLine = [
  "Кружки и термостаканы",
  "Шоперы и сумки",
  "Бутылки для воды",
  "Блокноты и ежедневники",
  "Ручки",
  "Значки и стикеры",
  "Зонты",
  "Пледы",
];

const clients = ["ЦФТ", "2ГИС", "NGS.RU", "AYS!GROUP", "Greenway", "KARMATRAVEL"];

const services = [
  {
    tag: "Своё производство",
    title: "Шьём одежду",
    desc: "Не перепродаём чужие заготовки: кроим и шьём сами. Поэтому можем поменять крой, длину, ткань и фурнитуру под вашу задачу.",
  },
  {
    tag: "Брендирование",
    title: "Мерч с вашим логотипом",
    desc: "Наносим логотип на изделия — вышивкой, шелкографией или полноцветной печатью. Разработаем макет, если его нет.",
  },
  {
    tag: "Свой бренд",
    title: "Одежда под вашей маркой",
    desc: "Отшиваем коллекции под чужими брендами — с вашими бирками, этикетками и упаковкой.",
  },
  {
    tag: "Коллаборации",
    title: "Совместные проекты",
    desc: "Делали коллекции с NGS.RU, НГУ и художниками. Приходите с идеей — доведём до тиража.",
  },
];

/** Вопросы, которые задают чаще всего. Идут и в разметку, и на страницу */
const faq = [
  {
    q: "Какой минимальный тираж?",
    a: "От одной единицы. Можно отшить пробник, чтобы посмотреть посадку и качество нанесения, а потом запустить партию.",
  },
  {
    q: "Сколько времени занимает заказ?",
    a: "Стандартный срок — 7–14 рабочих дней. Малые тиражи до 10 штук делаем за 5–7 дней. Срочные заказы просчитываем индивидуально.",
  },
  {
    q: "Можно прийти со своими лекалами?",
    a: "Да. Шьём по лекалам заказчика, если модель уже отработана. Также разрабатываем с нуля: подбираем ткань, строим лекала, отшиваем образец.",
  },
  {
    q: "Какие есть виды нанесения?",
    a: "ДТФ-печать с переносом на текстиль, шелкография и вышивка. Технологию подбираем под тираж и макет: шелкография выгоднее на больших партиях, ДТФ — на малых и сложных изображениях.",
  },
  {
    q: "Работаете только с Новосибирском?",
    a: "Производство в Новосибирске, работаем и с Москвой. Доставляем по всей России — СДЭК, Почта России или самовывоз.",
  },
  {
    q: "Нужен готовый макет?",
    a: "Не обязательно. Разработаем макет от 1 000 рублей или доведём ваш. Помогаем реализовать нестандартные дизайнерские идеи.",
  },
];

const process = [
  { n: "01", title: "Задача", desc: "Рассказываете, что нужно: изделие, тираж, сроки, бюджет." },
  { n: "02", title: "Макет", desc: "Готовим или дорабатываем макет — от 1 000 ₽." },
  { n: "03", title: "Образец", desc: "Быстро отшиваем образец и согласуем до старта производства." },
  { n: "04", title: "Производство", desc: "Кроим, шьём, наносим. Стандартный срок — 7–14 рабочих дней." },
  { n: "05", title: "Отгрузка", desc: "Упаковываем и отправляем: самовывоз, СДЭК или Почта России." },
];

/**
 * Страница читает медиа из файла при каждом запросе.
 * Без этого Next собрал бы её один раз, и загруженное через бота
 * не появлялось бы до следующего деплоя.
 */
export const dynamic = "force-dynamic";

// ─── страница ───────────────────────────────────────────────────────────────

export default function Home() {
  const media = getSiteMedia();

  return (
    <>
      {/* Прайс и ответы — для расширенных сниппетов в выдаче */}
      <JsonLd
        data={[
          catalogSchema([
            { title: "Одежда", rows: clothing },
            { title: "Аксессуары и сувенирная продукция", rows: accessories },
          ]),
          faqSchema(faq),
        ]}
      />

      {/* HERO */}
      <section className="border-b border-line">
        <Container className="py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
          <p className="label text-accent mb-6">Москва · Новосибирск · est. 2016</p>

          <h1 className="display text-ink mb-8" style={{ fontSize: "clamp(2.4rem, 8vw, 6rem)" }}>
            Шьём одежду
            <br />
            Печатаем мерч
          </h1>

          <p
            className="max-w-xl text-ink-soft mb-10"
            style={{ fontSize: "0.95rem", lineHeight: 1.75 }}
          >
            Своё производство полного цикла. Работаем и с крупным бизнесом,
            и с маленькими гордыми компаниями, и просто с людьми. Можно прийти
            со своей идеей и допилить изделие так, как считаете правильным.
          </p>

          <div className="flex flex-wrap gap-3">
            <LeadButton className="pill label bg-accent text-bg !px-8 !py-4 hover:bg-accent-soft">
              Оставить заявку
            </LeadButton>
            <a
              href="/shop"
              className="pill label dashed !px-8 !py-4 hover:bg-surface"
            >
              Смотреть магазин →
            </a>
          </div>

            </div>

            <HeroReels items={media.reels} />
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-line pt-10 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="display text-ink" style={{ fontSize: "1.9rem" }}>
                  {s.value}
                </p>
                <p className="label text-muted mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ЧТО ПРОИЗВОДИМ */}
      <section id="assortment" className="scroll-mt-20 border-b border-line bg-surface">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Что производим</p>
          <h2 className="display text-ink mb-10" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Одежда и сувенирка
          </h2>

          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="label text-muted mb-5">
                Одежда · свой пошив<span className="count">{clothingLine.length}</span>
              </p>
              <AssortmentGallery items={clothingLine} media={media.assortment} />
            </div>

            <div>
              <p className="label text-muted mb-5">
                Сувенирная продукция<span className="count">{souvenirLine.length}</span>
              </p>
              <AssortmentGallery items={souvenirLine} media={media.assortment} accentLast />
              <p className="label text-muted mt-5 leading-relaxed">
                По каталогам поставщиков и кастомные изделия под задачу
              </p>
            </div>
          </div>

          {/* Подпись-призыв вместо перечисления размеров */}
          <div className="mt-12 rounded-2xl bg-bg p-6 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-ink-soft" style={{ fontSize: "0.9rem", lineHeight: 1.7 }}>
                Быстро сделаем образец и доставим. Не нашли нужное в списке —
                тоже напишите, чаще всего сделаем.
              </p>
              <LeadButton className="pill label shrink-0 bg-accent text-bg !px-7 !py-3.5 hover:bg-accent-soft">
                Оставить заявку
              </LeadButton>
            </div>
          </div>
        </Container>
      </section>

      {/* ЧТО ДЕЛАЕМ */}
      <section id="services" className="scroll-mt-20 border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Что делаем</p>
          <h2 className="display text-ink mb-12" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Четыре направления
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <div key={s.title} className="rounded-2xl bg-surface p-6 md:p-7">
                <span className="pill label bg-accent text-bg !px-3 !py-1 mb-5">{s.tag}</span>
                <h3 className="label-lg text-ink mb-3">{s.title}</h3>
                <p className="text-ink-soft" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* КЛИЕНТЫ */}
      <section className="border-b border-line">
        <Container className="py-14 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center">
            <div>
              <p className="label text-accent mb-8">Нам доверяют</p>
              <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
                {clients.map((c) => (
                  <span key={c} className="label-lg text-ink-soft">
                    {c}
                  </span>
                ))}
              </div>
              <p className="label text-muted mt-8">
                А ещё НГУ, restme и десятки локальных проектов
              </p>
            </div>

            <VideoStrip items={media.clients} />
          </div>
        </Container>
      </section>

      {/* ПРАЙС */}
      <section id="price" className="scroll-mt-20 border-b border-line bg-surface">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Прайс</p>
          <h2 className="display text-ink mb-4" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Цена за единицу
          </h2>
          <p className="label text-muted mb-10 max-w-lg leading-relaxed">
            Нажмите на изделие — покажем цену по каждому тиражу и срок.
            Указана стоимость без нанесения, его считаем отдельно.
          </p>

          <PriceList title="Одежда" rows={clothing} />
          <div className="mt-12">
            <PriceList title="Аксессуары и сувенирка" rows={accessories} />
          </div>

          {/* Нанесение — компактной строкой, без отдельного блока */}
          <div className="mt-10 rounded-2xl bg-bg p-6">
            <p className="label text-muted mb-4">Нанесение считаем отдельно</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                { k: "ДТФ печать", v: "от 132 ₽" },
                { k: "Шелкография", v: "от 30 ₽" },
                { k: "Вышивка", v: "по запросу" },
              ].map((x) => (
                <span key={x.k} className="label text-ink-soft">
                  {x.k} <span className="text-accent">{x.v}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Срок изготовления", v: "7–14 рабочих дней" },
              { k: "Срочный тираж", v: "просчитывается индивидуально" },
              { k: "Разработка макета", v: "от 1 000 ₽" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-bg p-5">
                <p className="label text-muted">{x.k}</p>
                <p className="label-lg text-ink mt-2">{x.v}</p>
              </div>
            ))}
          </div>

          {/* Призыв к полному расчёту */}
          <div className="mt-8 rounded-2xl border border-accent p-6 md:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label-lg text-ink mb-2">Нужен точный расчёт?</p>
                <p className="text-ink-soft" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  Оставьте заявку — посчитаем ваш тираж с нанесением
                  и ответим в течение рабочего дня.
                </p>
              </div>
              <LeadButton className="pill label shrink-0 bg-accent text-bg !px-7 !py-3.5 hover:bg-accent-soft">
                Оставить заявку
              </LeadButton>
            </div>
          </div>
        </Container>
      </section>

      {/* КАК РАБОТАЕМ */}
      <section className="border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Как работаем</p>
          <h2 className="display text-ink mb-12" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            От задачи до отгрузки
          </h2>

          <ol className="border-t border-line">
            {process.map((p) => (
              <li
                key={p.n}
                className="grid gap-2 border-b border-line py-6 sm:grid-cols-[64px_210px_1fr] sm:items-baseline sm:gap-6"
              >
                <span className="label text-accent">{p.n}</span>
                <span className="label-lg text-ink">{p.title}</span>
                <span className="text-ink-soft" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {p.desc}
                </span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* О НАС */}
      <section id="about" className="scroll-mt-20 border-b border-line bg-surface">
        <Container className="py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="label text-accent mb-4">О нас</p>
              <h2
                className="display text-ink mb-6"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}
              >
                Швейное производство
                <br />
                и мерч в одном месте
              </h2>
              <p className="text-ink-soft mb-4" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
                Работаем на всех уровнях задачи. Наносим логотип на готовые
                изделия — это быстро и подходит, когда нужен понятный мерч
                к сроку. Шьём по вашим лекалам, если модель уже отработана
                и её нужно повторить в тираже. И разрабатываем с нуля:
                подбираем ткань, строим лекала, отшиваем образец.
              </p>
              <p className="text-ink-soft mb-4" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
                Свой крой и свой пошив дают свободу в мелочах, из которых
                и складывается вещь: посадка, длина, плотность полотна,
                фурнитура, бирки и упаковка.
              </p>
              <p className="text-ink-soft" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
                Производство в Новосибирске и в Москве. Помогаем довести
                нестандартную идею от эскиза до готового тиража.
              </p>
            </div>

            <div className="self-start">
              <div className="grid grid-cols-2 gap-4">
              {[
                { t: "Свой крой", d: "Меняем посадку и лекала под задачу" },
                { t: "Тираж от 1", d: "Пробник или партия на тысячу" },
                { t: "Макет в цене", d: "Соберём с нуля или доведём ваш" },
                { t: "Образец", d: "Быстро отошьём до старта тиража" },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl bg-bg p-5">
                  <p className="label-lg text-ink mb-2">{x.t}</p>
                  <p className="label text-muted leading-relaxed">{x.d}</p>
                </div>
              ))}
              </div>

              <ProductionCarousel items={media.production} />
            </div>
          </div>
        </Container>
      </section>

      {/* ЧАСТЫЕ ВОПРОСЫ */}
      <section id="faq" className="scroll-mt-20 border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Частые вопросы</p>
          <h2 className="display text-ink mb-10" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Что спрашивают чаще всего
          </h2>

          <div className="max-w-[760px] border-t border-line">
            {faq.map((item) => (
              <details key={item.q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 transition-colors hover:text-accent [&::-webkit-details-marker]:hidden">
                  <span className="label-lg text-ink">{item.q}</span>
                  <span
                    aria-hidden
                    className="shrink-0 text-accent transition-transform duration-300 group-open:rotate-180"
                  >
                    ↓
                  </span>
                </summary>
                <p
                  className="text-ink-soft pb-5 pr-8"
                  style={{ fontSize: "0.9rem", lineHeight: 1.75 }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* КОНТАКТЫ */}
      <section id="contact" className="scroll-mt-20">
        <Container className="py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <p className="label text-accent mb-4">Контакты</p>
              <h2
                className="display text-ink mb-6"
                style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}
              >
                Обсудим задачу
              </h2>
              <p className="text-ink-soft mb-10" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
                Расскажите, что нужно — посчитаем и предложим варианты
                под ваш бюджет и сроки. Отвечаем в течение рабочего дня.
              </p>

              <div className="space-y-3">
                <a
                  href={siteContact.phoneHref}
                  className="flex items-baseline justify-between gap-4 border-b border-line pb-3 hover:text-accent"
                >
                  <span className="label text-muted">Телефон</span>
                  <span className="label-lg text-ink">{siteContact.phone}</span>
                </a>
                <a
                  href={siteContact.emailHref}
                  className="flex items-baseline justify-between gap-4 border-b border-line pb-3 hover:text-accent"
                >
                  <span className="label text-muted">Почта</span>
                  <span className="label-lg text-ink">{siteContact.email}</span>
                </a>
                <a
                  href="https://t.me/svobodamerch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-baseline justify-between gap-4 border-b border-line pb-3 hover:text-accent"
                >
                  <span className="label text-muted">Telegram</span>
                  <span className="label-lg text-ink">@svobodamerch</span>
                </a>
              </div>

              <LeadButton className="pill label mt-8 w-full justify-center bg-accent text-bg !py-4 hover:bg-accent-soft sm:w-auto sm:!px-9">
                Оставить заявку
              </LeadButton>
            </div>

            <div className="self-start rounded-2xl bg-surface p-6 md:p-8">
              {/* Магазин: переход + возможность сразу оставить заявку */}
              <p className="label text-muted mb-2">Магазин</p>
              <p className="label-lg text-ink mb-3">Заказать онлайн</p>
              <p className="text-ink-soft mb-5" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                Готовые вещи из наличия и база под ваш принт — с оформлением
                прямо на сайте.
              </p>

              <div className="flex flex-col gap-2.5">
                <a
                  href="/shop"
                  className="pill label w-full justify-center bg-accent text-bg !py-3.5 hover:bg-accent-soft"
                >
                  Перейти в магазин →
                </a>
                <LeadButton className="pill label dashed w-full justify-center !py-3.5 hover:bg-bg">
                  Не нашли нужное? Оставить заявку
                </LeadButton>
              </div>

              <p className="label text-muted mt-8 mb-4">Мы в соцсетях</p>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pill label justify-center bg-bg text-ink-soft !py-3.5 hover:text-accent"
                  >
                    {s.label}
                    {s.label === "Instagram" && (
                      <span className="ml-0.5 text-[9px] text-muted">†</span>
                    )}
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
