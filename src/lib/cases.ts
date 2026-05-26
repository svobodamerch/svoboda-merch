import { images } from "@/lib/images";

export type CaseStudyType = "корп. мерч" | "комьюнити" | "ивент" | "drop";

export type CaseStudyFilter = CaseStudyType | "all";

export type CaseStudyLayout = "hero" | "tall" | "wide" | "standard";

export type CaseStudy = {
  id: string;
  slug: string;
  client: string;
  type: CaseStudyType;
  task: string;
  metric: string;
  image: string;
  featured?: boolean;
  layout: CaseStudyLayout;
};

export const CASE_FILTERS: { value: CaseStudyFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "корп. мерч", label: "Корп. мерч" },
  { value: "комьюнити", label: "Комьюнити" },
  { value: "ивент", label: "Ивент" },
  { value: "drop", label: "Дроп" },
];

export const allCaseStudies: CaseStudy[] = [
  {
    id: "1",
    slug: "mari-kraimberi-concert",
    client: "Мари Краймбрери",
    type: "ивент",
    task: "Сольный концерт — 2000 футболок за майские праздники. Быстрый тираж под жёсткий дедлайн.",
    metric: "2000 футболок",
    image: images.event,
    featured: true,
    layout: "hero",
  },
  {
    id: "2",
    slug: "karmatravel-tours",
    client: "Karmatravel",
    type: "корп. мерч",
    task: "Мерч для путешествий — футболки, шопперы и аксессуары для туристических групп.",
    metric: "Поездки по всей России",
    image: images.team,
    featured: true,
    layout: "tall",
  },
  {
    id: "3",
    slug: "greltkafest",
    client: "Грелкафест",
    type: "ивент",
    task: "Сувенирная продукция, полиграфия и мерч для ежегодного фестиваля.",
    metric: "Фестивальный тираж",
    image: images.event,
    featured: true,
    layout: "wide",
  },
  {
    id: "4",
    slug: "dinoterra",
    client: "Динотерра",
    type: "корп. мерч",
    task: "Мерч и сувениры для детского развлекательного центра.",
    metric: "Постоянная линейка",
    image: images.fashion,
    layout: "standard",
  },
  {
    id: "5",
    slug: "corporate-events",
    client: "Мероприятия",
    type: "ивент",
    task: "Корпоративные мероприятия — униформа стаффа, подарочные наборы для участников.",
    metric: "Разные масштабы",
    image: images.event,
    layout: "standard",
  },
  {
    id: "6",
    slug: "corporate-merch-souvenirs",
    client: "Корпоративный мерч",
    type: "корп. мерч",
    task: "Корпоративный мерч и сувенирная продукция — от идеи до готового тиража.",
    metric: "Под ключ",
    image: images.office,
    layout: "tall",
  },
  {
    id: "7",
    slug: "2gis-prints",
    client: "2ГИС",
    type: "корп. мерч",
    task: "Разработка принтов для корпоративного мерча компании.",
    metric: "Дизайн + тираж",
    image: images.knit,
    layout: "wide",
  },
  {
    id: "8",
    slug: "novosibirsk-maps",
    client: "Карты Новосибирска",
    type: "комьюнити",
    task: "Академгородок, Кольцово — локальные принты и мерч для жителей города.",
    metric: "Локальный бестселлер",
    image: images.fashion,
    layout: "standard",
  },
  {
    id: "9",
    slug: "shkulev-media",
    client: "Шкулев Медиа",
    type: "корп. мерч",
    task: "Корпоративный мерч для медиахолдинга — от разработки до производства.",
    metric: "Медиа-индустрия",
    image: images.team,
    layout: "standard",
  },
];

export const featuredCaseStudies = allCaseStudies.filter((study) => study.featured);

export function filterCaseStudies(
  studies: CaseStudy[],
  filter: CaseStudyFilter,
): CaseStudy[] {
  if (filter === "all") return studies;
  return studies.filter((study) => study.type === filter);
}

export const layoutGridClass: Record<CaseStudyLayout, string> = {
  hero: "col-span-12 lg:col-span-7 lg:row-span-2 min-h-[420px] lg:min-h-[640px]",
  tall: "col-span-12 sm:col-span-6 lg:col-span-5 min-h-[380px] lg:min-h-[520px]",
  wide: "col-span-12 sm:col-span-6 lg:col-span-7 min-h-[360px] lg:min-h-[300px]",
  standard: "col-span-12 sm:col-span-6 lg:col-span-5 min-h-[360px] lg:min-h-[300px]",
};
