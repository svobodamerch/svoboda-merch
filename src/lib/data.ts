export const trustFacts = [
  { value: "8+", label: "лет в мерче и брендинге" },
  { value: "500+", label: "реализованных проектов" },
  { value: "от 30", label: "единиц в тираже" },
  { value: "14", label: "дней — средний срок" },
  { value: "НСК", label: "производство в Новосибирске" },
] as const;

export const productPaths = [
  {
    title: "Корпоративный мерч",
    description:
      "Одежда и аксессуары для команды, ивентов и HR-бренда — с узнаваемым характером, не «просто с логотипом».",
    tag: "B2B",
    href: "#corporate",
  },
  {
    title: "Комьюнити и клубы",
    description:
      "Коллекции для сообществ, фестивалей и локальных сцен — то, что люди носят сами, а не кладут в шкаф.",
    tag: "Community",
    href: "#community",
  },
  {
    title: "Независимые проекты",
    description:
      "Малые тиражи для артистов, стартапов и креативных брендов — от эскиза до партии без компромиссов по качеству.",
    tag: "Indie",
    href: "#indie",
  },
  {
    title: "Полный цикл",
    description:
      "Концепт, дизайн, подбор тканей, производство и логистика — один партнёр на весь путь.",
    tag: "Full cycle",
    href: "#full-cycle",
  },
] as const;

export const whyUs = [
  {
    title: "Дизайн, а не печать",
    description:
      "Сначала идея и визуальный язык — потом носитель. Мерч как часть бренда, а не разовая раздача.",
  },
  {
    title: "Премиальные материалы",
    description:
      "Ткани и фурнитура уровня streetwear: плотный хлопок, аккуратные швы, посадка, которую хочется носить.",
  },
  {
    title: "Гибкие тиражи",
    description:
      "От пилотной партии до крупного заказа — масштабируем без потери качества и сроков.",
  },
  {
    title: "Локальное производство",
    description:
      "Контроль на каждом этапе в Новосибирске: быстрее правки, прозрачнее процесс, ближе к вам.",
  },
] as const;

export const featuredProducts = [
  {
    name: "Оверсайз худи",
    category: "Худи",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
  },
  {
    name: "Футболка heavyweight",
    category: "Футболки",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  },
  {
    name: "Свитшот crewneck",
    category: "Свитшоты",
    image:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
  },
  {
    name: "Бомбер",
    category: "Верхняя одежда",
    image:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
  },
  {
    name: "Шоппер canvas",
    category: "Аксессуары",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
  },
  {
    name: "Кепка 6-panel",
    category: "Головные уборы",
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80",
  },
  {
    name: "Свитер knit",
    category: "Трикотаж",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
  },
  {
    name: "Сумка crossbody",
    category: "Аксессуары",
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d12836?w=800&q=80",
  },
] as const;

export const processSteps = [
  {
    step: "01",
    title: "Бриф и идея",
    description: "Погружаемся в бренд, аудиторию и задачу — фиксируем направление и бюджет.",
  },
  {
    step: "02",
    title: "Концепт и дизайн",
    description: "Мудборды, эскизы, визуализации — согласуем до производства.",
  },
  {
    step: "03",
    title: "Образцы",
    description: "Пробные изделия и правки по посадке, цвету и материалам.",
  },
  {
    step: "04",
    title: "Производство",
    description: "Печать, вышивка, пошив — контроль качества на каждом этапе.",
  },
  {
    step: "05",
    title: "Доставка",
    description: "Упаковка, маркировка и отправка по России — готово к раздаче.",
  },
] as const;

export const navLinks = [
  { label: "Направления", href: "/#directions" },
  { label: "Коллекция", href: "/#collection" },
  { label: "Кейсы", href: "/cases" },
  { label: "Процесс", href: "/#process" },
] as const;
