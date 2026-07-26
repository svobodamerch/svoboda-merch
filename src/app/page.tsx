import { Container } from "@/components/ui/Container";
import { LeadButton } from "@/components/ui/LeadButton";
import { AssortmentGallery } from "@/components/home/AssortmentGallery";
import { HeroReels } from "@/components/home/HeroReels";
import { VideoStrip } from "@/components/home/VideoStrip";
import { ProductionCarousel } from "@/components/home/ProductionCarousel";
import { siteContact, socialLinks } from "@/lib/navigation";
import { getSiteMedia } from "@/lib/media";

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

/** Цены за единицу, ₽. Порядок колонок соответствует priceTiers */
const priceTiers = ["1–10 шт", "10–50 шт", "от 100 шт", "от 500 шт", "от 1000 шт"];
const leadTimes = ["5–7 дней", "7–14 дней", "15–30 дней", "1–1,5 месяца", "1–2 месяца"];

const clothing = [
  {
    name: "Футболка оверсайз",
    spec: "Футер 2 нитка · 92% хлопок, 8% эластан",
    prices: [2100, 1900, 1700, 1500, 1300],
  },
  {
    name: "Худи классика",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4000, 3800, 3600, 3400, 3200],
  },
  {
    name: "Худи классика, начёс",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Худи оверсайз, начёс",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Кофта с замком",
    spec: "Футер 3 нитка диагональ · 85% хлопок, 15% полиэстер",
    prices: [4200, 4000, 3800, 3600, 3400],
  },
  {
    name: "Рубашка",
    spec: "Джинса или вельвет · карман на кнопке, не выцветает",
    prices: [5000, 4900, 4700, 4500, 4300],
  },
  {
    name: "Жилет",
    spec: "Софтшел · наполнитель синтепон, подкладка кулирка",
    prices: [8000, 7800, 7600, 7400, 7000],
  },
];

const accessories = [
  { name: "Шопер", spec: "Саржа, хлопок, бязь", prices: [1000, 900, 700, 600, 550] },
  { name: "Кепка", spec: "Вышивка · one size", prices: [1300, 1200, 1000, 900, 800] },
  { name: "Шапка", spec: "Вышивка · one size", prices: [1200, 1000, 850, 840, 800] },
  { name: "Кружка", spec: "Полноцветная печать, цветная внутри", prices: [500, 480, 450, 400, 350] },
];

const process = [
  { n: "01", title: "Задача", desc: "Рассказываете, что нужно: изделие, тираж, сроки, бюджет." },
  { n: "02", title: "Макет", desc: "Готовим или дорабатываем макет — от 1 000 ₽." },
  { n: "03", title: "Образец", desc: "Быстро отшиваем образец и согласуем до старта производства." },
  { n: "04", title: "Производство", desc: "Кроим, шьём, наносим. Стандартный срок — 7–14 рабочих дней." },
  { n: "05", title: "Отгрузка", desc: "Упаковываем и отправляем: самовывоз, СДЭК или Почта России." },
];

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

// ─── страница ───────────────────────────────────────────────────────────────

export default function Home() {
  const media = getSiteMedia();

  return (
    <>
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
          <p className="label text-accent mb-8">Что производим</p>

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
            Чем больше тираж, тем ниже цена. Указана стоимость изделия
            без нанесения — его считаем отдельно.
          </p>

          <PriceTable title="Одежда" rows={clothing} />
          <div className="mt-12">
            <PriceTable title="Аксессуары и сувенирка" rows={accessories} />
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

// ─── таблица цен ────────────────────────────────────────────────────────────

interface PriceRow {
  name: string;
  spec: string;
  prices: number[];
}

function PriceTable({ title, rows }: { title: string; rows: PriceRow[] }) {
  return (
    <div>
      <h3 className="label-lg text-ink mb-4">{title}</h3>

      {/* Таблица шире экрана телефона — прокручивается по горизонтали */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="border-b border-line">
              <th className="label text-muted py-3 pr-4 text-left font-normal">Изделие</th>
              {priceTiers.map((t, i) => (
                <th key={t} className="label text-muted py-3 pl-4 text-right font-normal">
                  {t}
                  <span className="block text-[9px] normal-case tracking-normal opacity-70">
                    {leadTimes[i]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-line">
                <td className="py-4 pr-4">
                  <span className="label-lg text-ink block">{r.name}</span>
                  <span className="label text-muted mt-1.5 block normal-case tracking-normal">
                    {r.spec}
                  </span>
                </td>
                {r.prices.map((p, i) => (
                  <td
                    key={i}
                    className={`label py-4 pl-4 text-right ${
                      i === 0 ? "text-ink" : "text-ink-soft"
                    }`}
                  >
                    <span className="text-muted">от </span>
                    {money(p)} ₽
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
