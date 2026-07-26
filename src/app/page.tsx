import { Container } from "@/components/ui/Container";
import { siteContact, socialLinks } from "@/lib/navigation";

// ─── данные из коммерческого предложения ───────────────────────────────────

const stats = [
  { value: "с 2016", label: "делаем мерч" },
  { value: "от 1", label: "единицы в тираже" },
  { value: "3", label: "вида нанесения" },
  { value: "7–14", label: "рабочих дней" },
];

/** Ассортимент — крупный типографический блок, приём из КП */
const assortment = [
  "Футболки",
  "Рубашки",
  "Лонгсливы",
  "Свитшоты",
  "Толстовки и худи",
  "Жилеты",
  "Головные уборы",
  "Аксессуары",
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
    desc: "Делали коллекции с NGS.RU, аэропортом Кольцово, НГУ и художниками. Приходите с идеей — доведём до тиража.",
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

const printing = [
  {
    title: "ДТФ печать",
    from: "от 132 ₽",
    desc: "Полноцветная печать с переносом на текстиль. Ложится на хлопок, лён, вискозу, синтетику, кожу, флис, фетр и ворсовые изделия.",
    note: "Форматы от мини (9 см) до 50×50 см",
  },
  {
    title: "Шелкография",
    from: "от 30 ₽",
    desc: "Для больших тиражей — самая низкая цена за единицу. До 6 цветов в макете либо полноцвет CMYK.",
    note: "Минимальный тираж 30 шт · макс. размер 42 см",
  },
  {
    title: "Вышивка",
    from: "по запросу",
    desc: "Плотное и долговечное нанесение: не выцветает и не трескается. Хорошо смотрится на трикотаже, кепках и шапках.",
    note: "Считаем по количеству стежков",
  },
];

const process = [
  { n: "01", title: "Задача", desc: "Рассказываете, что нужно: изделие, тираж, сроки, бюджет." },
  { n: "02", title: "Макет", desc: "Готовим или дорабатываем макет. Простой — 1 000 ₽, правка вашего — 500 ₽." },
  { n: "03", title: "Образец", desc: "На больших тиражах отшиваем образец и согласуем до старта производства." },
  { n: "04", title: "Производство", desc: "Кроим, шьём, наносим. Стандартный срок — 7–14 рабочих дней." },
  { n: "05", title: "Отгрузка", desc: "Упаковываем и отправляем: самовывоз, СДЭК или Почта России." },
];

const money = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

// ─── страница ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-line">
        <Container className="py-20 md:py-28">
          <p className="label text-accent mb-6">
            Новосибирск · Москва · швейное производство с 2016 года
          </p>

          <h1 className="display text-ink mb-8" style={{ fontSize: "clamp(2.4rem, 8vw, 6rem)" }}>
            Шьём одежду
            <br />
            Делаем мерч
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
            <a
              href="/shop"
              className="pill label bg-accent text-bg !py-4 !px-8 hover:bg-accent-soft"
            >
              Смотреть магазин →
            </a>
            <a
              href={siteContact.phoneHref}
              className="pill label dashed !py-4 !px-8 hover:bg-surface"
            >
              {siteContact.phone}
            </a>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-line pt-10 sm:grid-cols-4">
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

      {/* АССОРТИМЕНТ */}
      <section id="assortment" className="scroll-mt-20 border-b border-line bg-surface">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-8">
            Что шьём<span className="count">{assortment.length}</span>
          </p>
          <ul className="space-y-1">
            {assortment.map((item) => (
              <li
                key={item}
                className="display text-ink"
                style={{ fontSize: "clamp(1.6rem, 5.5vw, 3.6rem)" }}
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="label text-muted mt-10 max-w-md leading-relaxed">
            Размеры S–XXL, унисекс. Больше 17 цветов ткани на выбор.
            Нестандартный крой и размеры — по согласованию.
          </p>
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
                <span className="pill label bg-accent text-bg !py-1 !px-3 mb-5">{s.tag}</span>
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
          <p className="label text-accent mb-8">Нам доверяют</p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            {clients.map((c) => (
              <span key={c} className="label-lg text-ink-soft">
                {c}
              </span>
            ))}
          </div>
          <p className="label text-muted mt-8">
            А ещё НГУ, аэропорт Кольцово, restme и десятки локальных проектов
          </p>
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
            <PriceTable title="Аксессуары" rows={accessories} />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Срок изготовления", v: "7–14 рабочих дней" },
              { k: "Срочно, до 5 дней", v: "+50% к стоимости" },
              { k: "Разработка макета", v: "1 000 ₽ · правка 500 ₽" },
            ].map((x) => (
              <div key={x.k} className="rounded-xl bg-bg p-5">
                <p className="label text-muted">{x.k}</p>
                <p className="label-lg text-ink mt-2">{x.v}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* НАНЕСЕНИЕ */}
      <section id="printing" className="scroll-mt-20 border-b border-line">
        <Container className="py-16 md:py-24">
          <p className="label text-accent mb-4">Нанесение</p>
          <h2 className="display text-ink mb-12" style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)" }}>
            Три технологии
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {printing.map((p) => (
              <div key={p.title} className="rounded-2xl border border-line p-6 md:p-7">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h3 className="label-lg text-ink">{p.title}</h3>
                  <span className="label text-accent shrink-0">{p.from}</span>
                </div>
                <p className="text-ink-soft mb-4" style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
                  {p.desc}
                </p>
                <p className="label text-muted leading-relaxed">{p.note}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* КАК РАБОТАЕМ */}
      <section className="border-b border-line bg-surface">
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
      <section id="about" className="scroll-mt-20 border-b border-line">
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
                Мы не просто наносим логотип на готовую футболку. У нас свой крой
                и свой пошив — поэтому изделие можно поменять: посадку, длину,
                плотность ткани, фурнитуру.
              </p>
              <p className="text-ink-soft" style={{ fontSize: "0.9rem", lineHeight: 1.75 }}>
                Производство в Новосибирске, работаем и с Москвой. Помогаем
                реализовать нестандартные дизайнерские идеи — от эскиза
                до готового тиража.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 self-start">
              {[
                { t: "Свой крой", d: "Меняем посадку и лекала под задачу" },
                { t: "Тираж от 1", d: "Пробник или партия на тысячу" },
                { t: "Макет в цене", d: "Соберём с нуля или доведём ваш" },
                { t: "Образец", d: "Отшиваем до старта большого тиража" },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl bg-surface p-5">
                  <p className="label-lg text-ink mb-2">{x.t}</p>
                  <p className="label text-muted leading-relaxed">{x.d}</p>
                </div>
              ))}
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
                под ваш бюджет и сроки.
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
            </div>

            <div className="self-start rounded-2xl bg-surface p-6 md:p-8">
              <p className="label text-muted mb-6">Мы в соцсетях</p>
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

              <a
                href="/shop"
                className="pill label mt-6 w-full justify-center bg-accent text-bg !py-4 hover:bg-accent-soft"
              >
                Каталог и заказ онлайн →
              </a>
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
