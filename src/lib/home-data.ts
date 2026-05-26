import { homeCopy } from "@/lib/copy";
import { images } from "@/lib/images";

export const trustStrip = homeCopy.trust;
export const guaranteeChecks = trustStrip;

export const services = [
  {
    title: "Печать",
    description: "Шелкография, термоперенос и цифровая печать — подбираем метод под тираж, ткань и задачу бренда.",
    image: images.print,
  },
  {
    title: "Вышивка",
    description: "Плоская и объёмная вышивка на худи, кепках и поло — аккуратно, плотно, долговечно.",
    image: images.embroidery,
  },
  {
    title: "Кастомизация",
    description: "Ярлыки, нашивки, упаковка и детали — мерч как часть айдентики бренда.",
    image: images.custom,
  },
] as const;

export const productPaths = homeCopy.productPaths.items;
export const whyUsItems = homeCopy.whyUs.items;

export const reviews = [
  {
    id: "1",
    text: "Заказывали наборы для новых сотрудников на 80 человек — команда до сих пор носит худи. Качество ткани и принта на уровне хороших брендов.",
    author: "Анна К.",
    role: "Руководитель по персоналу, ИТ-компания",
    rating: 5,
  },
  {
    id: "2",
    text: "Сделали мерч для фестиваля — раскупили за два дня. Дизайн попал в настроение события, а сроки выдержали впритык к дате.",
    author: "Максим Р.",
    role: "Организатор мероприятий",
    rating: 5,
  },
  {
    id: "3",
    text: "Наконец нашли подрядчика, который думает как дизайнеры, а не как типография. Образцы, правки, финальный тираж — всё прозрачно.",
    author: "Елена С.",
    role: "Менеджер по бренду, кофейня",
    rating: 5,
  },
  {
    id: "4",
    text: "Заказали ограниченный выпуск для сообщества — 200 худи с нумерацией. Упаковка, бирки, доставка — всё под ключ.",
    author: "Игорь В.",
    role: "Основатель сообщества",
    rating: 5,
  },
  {
    id: "5",
    text: "Корпоративные подарки для клиентов: шопперы и термосы в едином стиле. Получили комплименты от партнёров.",
    author: "Ольга М.",
    role: "Маркетинг, технологическая компания",
    rating: 5,
  },
] as const;

export type ProductCategory =
  | "Футболки"
  | "Худи"
  | "Свитшоты"
  | "Шопперы"
  | "Кепки"
  | "Аксессуары"
  | "Блокноты";

export const productCategories: ProductCategory[] = [
  "Футболки",
  "Худи",
  "Свитшоты",
  "Шопперы",
  "Кепки",
  "Аксессуары",
  "Блокноты",
];

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  rating: number;
  reviews: number;
  image: string;
};

export const products: Product[] = [
  { id: "t1", name: "Тяжёлая футболка", brand: "Свобода Базис", category: "Футболки", rating: 4.9, reviews: 128, image: images.tee },
  { id: "t2", name: "Оверсайз хлопок", brand: "Свобода Базис", category: "Футболки", rating: 4.8, reviews: 94, image: images.fashion },
  { id: "t3", name: "Лонгслив приталенный", brand: "Свобода Базис", category: "Футболки", rating: 4.7, reviews: 56, image: images.sweater },
  { id: "h1", name: "Классическое худи", brand: "Свобода Одежда", category: "Худи", rating: 5.0, reviews: 203, image: images.hoodie },
  { id: "h2", name: "Худи на молнии", brand: "Свобода Одежда", category: "Худи", rating: 4.9, reviews: 87, image: images.hoodie },
  { id: "s1", name: "Свитшот с горловиной", brand: "Свобода Одежда", category: "Свитшоты", rating: 4.8, reviews: 72, image: images.sweater },
  { id: "s2", name: "Оверсайз свитшот", brand: "Свобода Одежда", category: "Свитшоты", rating: 4.9, reviews: 61, image: images.knit },
  { id: "b1", name: "Холщовый шоппер", brand: "Свобода Акс", category: "Шопперы", rating: 4.8, reviews: 145, image: images.tote },
  { id: "b2", name: "Шоппер из переработки", brand: "Свобода Акс", category: "Шопперы", rating: 4.7, reviews: 89, image: images.bag },
  { id: "c1", name: "Кепка шестипанельная", brand: "Свобода Акс", category: "Кепки", rating: 4.9, reviews: 112, image: images.cap },
  { id: "c2", name: "Кепка мягкая", brand: "Свобода Акс", category: "Кепки", rating: 4.8, reviews: 67, image: images.cap },
  { id: "a1", name: "Блокнот А5", brand: "Свобода Акс", category: "Блокноты", rating: 4.7, reviews: 43, image: images.tote },
  { id: "a2", name: "Термос 500 мл", brand: "Свобода Акс", category: "Аксессуары", rating: 4.8, reviews: 38, image: images.bag },
] as const;

export const categoryGallery = [
  { name: "Уличный стиль", image: images.hoodie },
  { name: "Корпоративный", image: images.team },
  { name: "Сообщества", image: images.fashion },
  { name: "Мероприятия", image: images.event },
  { name: "Хорека", image: images.coffee },
  { name: "Ограниченные выпуски", image: images.fashion },
] as const;

export const forWhomCards = [
  {
    title: "Хорека",
    description: "Фартуки, футболки и шопперы с характером локального бренда.",
    image: images.coffee,
    href: "/business",
  },
  {
    title: "ИТ-компании",
    description: "Наборы для новых сотрудников, командный мерч и брендинг на конференции.",
    image: images.office,
    href: "/business",
  },
  {
    title: "Сообщества",
    description: "Коллекции для клубов, движений и аудитории — то, что носят сами.",
    image: images.fashion,
    href: "/community",
  },
  {
    title: "Мероприятия",
    description: "Мерч фестивалей, конференций и корпоративов под ключ.",
    image: images.event,
    href: "/cases",
  },
  {
    title: "Уличный стиль",
    description: "Ограниченные выпуски и капсульные коллекции.",
    image: images.hoodie,
    href: "/cases",
  },
  {
    title: "Корпоративные подарки",
    description: "Наборы для клиентов и партнёров — упаковка и брендинг включены.",
    image: images.gifts,
    href: "/business",
  },
] as const;

export const brandStory = {
  quote: homeCopy.brandStory.quote,
  author: homeCopy.brandStory.author,
  image: images.studio,
};

export const philosophyQuote = homeCopy.philosophy;
export const reviewCount = 240;

// ─── МАГАЗИН ДРОПОВ ─────────────────────────────────────────

export type DropStatus = "доступен" | "скоро" | "распродан";

export type Drop = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  price: number;
  status: DropStatus;
  releaseDate: string;
  items: string[];      // что входит в дроп
  totalUnits?: number;  // сколько всего выпущено (если есть)
  soldUnits?: number;   // сколько продано
  tags: string[];
};

export const drops: Drop[] = [
  {
    id: "drop-001",
    title: "Выпуск №001 — Новосибирск",
    subtitle: "Первая капсула",
    description: "Первый выпуск Свободы. Минималистичный мерч про город, в котором мы живём и работаем. Ограниченно — 100 комплектов.",
    image: images.hoodie,
    price: 2900,
    status: "доступен",
    releaseDate: "2024-03-01",
    items: ["Футболка оверсайз", "Шоппер холщовый", "Наклейки"],
    totalUnits: 100,
    soldUnits: 67,
    tags: ["город", "минимализм", "первый выпуск"],
  },
  {
    id: "drop-002",
    title: "Выпуск №002 — Свобода работает",
    subtitle: "Для тех, кто строит своё",
    description: "Мерч для предпринимателей, самозанятых и всех, кто выбрал собственный путь. Юмор про налоги, счастье без дедлайнов и кофе в 23:00.",
    image: images.tee,
    price: 1900,
    status: "скоро",
    releaseDate: "2024-05-01",
    items: ["Футболка с принтом", "Значок"],
    totalUnits: 200,
    soldUnits: 0,
    tags: ["предприниматели", "юмор", "самозанятые"],
  },
  {
    id: "drop-003",
    title: "Выпуск №000 — Архив",
    subtitle: "Уже нет в наличии",
    description: "Нулевой выпуск — пилотный тираж для друзей и команды. Архивный экземпляр.",
    image: images.fashion,
    price: 3500,
    status: "распродан",
    releaseDate: "2023-11-01",
    items: ["Худи", "Открытка", "Бирка коллекционера"],
    totalUnits: 30,
    soldUnits: 30,
    tags: ["архив", "коллекция"],
  },
] as const;
