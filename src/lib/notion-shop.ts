import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const shopDbId = process.env.NOTION_SHOP_DATABASE_ID;

let notionClient: Client | null = null;

function getClient(): Client | null {
  if (!token || !shopDbId) return null;
  if (!notionClient) {
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}

export type ProductStatus = "available" | "sold_out" | "coming_soon";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  description: string;
  colors: string[];
  imageUrl: string;
  imageBg: string;
  totalUnits?: number;
  soldUnits?: number;
  isNew: boolean;
  isDrop: boolean;
  dropNumber?: number;
  status: ProductStatus;
};

const fallbackProducts: Product[] = [
  {
    id: "p1",
    slug: "svoboda-hudi-black",
    name: "Свобода Худи",
    category: "Худи",
    price: 5900,
    oldPrice: 7200,
    description: "Оверсайз худи премиум-класса. 100% органический хлопок. Тёплый флис внутри.",
    colors: ["#1a1a1a", "#f1f0eb", "#8B4513"],
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    imageBg: "#1a1a1a",
    totalUnits: 100,
    soldUnits: 87,
    isNew: false,
    isDrop: true,
    dropNumber: 3,
    status: "available",
  },
  {
    id: "p2",
    slug: "svoboda-tee-white",
    name: "Свобода Футболка",
    category: "Футболки",
    price: 2900,
    description: "Базовая футболка с минималистичным логотипом. Плотность 220 г/м².",
    colors: ["#ffffff", "#1a1a1a", "#c41e3a"],
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    imageBg: "#f1f0eb",
    totalUnits: 200,
    soldUnits: 12,
    isNew: true,
    isDrop: false,
    status: "available",
  },
  {
    id: "p3",
    slug: "svoboda-cap-navy",
    name: "Свобода Кепка",
    category: "Кепки",
    price: 1900,
    oldPrice: 2500,
    description: "Шестипанельная кепка с вышитым логотипом. Регулируемый ремешок.",
    colors: ["#1B3A5C", "#1a1a1a", "#8B7355"],
    imageUrl: "https://images.unsplash.com/photo-1534215754734-18e55ddb4d5a?w=800&q=80",
    imageBg: "#1B3A5C",
    totalUnits: 50,
    soldUnits: 45,
    isNew: false,
    isDrop: true,
    dropNumber: 3,
    status: "available",
  },
  {
    id: "p4",
    slug: "svoboda-tote-eco",
    name: "Свобода Шоппер",
    category: "Шопперы",
    price: 1500,
    description: "Эко-шоппер из переработанного хлопка. Вместимость 15 литров.",
    colors: ["#f1f0eb", "#2F4F4F", "#D2691E"],
    imageUrl: "https://images.unsplash.com/photo-1597484662317-9bd7bdda2907?w=800&q=80",
    imageBg: "#e8e4d9",
    totalUnits: 80,
    soldUnits: 3,
    isNew: true,
    isDrop: false,
    status: "available",
  },
  {
    id: "p5",
    slug: "svoboda-notebook",
    name: "Свобода Блокнот",
    category: "Блокноты",
    price: 900,
    description: "Блокнот A5 с твёрдой обложкой. 120 страниц, точечная разметка.",
    colors: ["#1a1a1a", "#f1f0eb"],
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80",
    imageBg: "#2F2F2F",
    totalUnits: 60,
    soldUnits: 58,
    isNew: false,
    isDrop: false,
    status: "available",
  },
  {
    id: "p6",
    slug: "svoboda-crewneck",
    name: "Свобода Свитшот",
    category: "Худи",
    price: 4900,
    description: "Классический свитшот crew neck. Мягкий начёс внутри, не катывается.",
    colors: ["#f1f0eb", "#1a1a1a", "#808080"],
    imageUrl: "https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&q=80",
    imageBg: "#e0ddd5",
    totalUnits: 120,
    soldUnits: 0,
    isNew: true,
    isDrop: false,
    status: "available",
  },
  {
    id: "p7",
    slug: "svoboda-drop3-bundle",
    name: "Дроп №3 — Бандл",
    category: "Дропы",
    price: 8900,
    oldPrice: 11000,
    description: "Лимитированный набор: худи + футболка + кепка. Нумерация 1–100.",
    colors: ["#1a1a1a"],
    imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80",
    imageBg: "#0d0d0d",
    totalUnits: 100,
    soldUnits: 100,
    isNew: false,
    isDrop: true,
    dropNumber: 3,
    status: "sold_out",
  },
  {
    id: "p8",
    slug: "svoboda-tee-limited",
    name: "Свобода Лимитка",
    category: "Футболки",
    price: 3900,
    description: "Футболка с авторским принтом от нашего дизайнера. 50 экземпляров.",
    colors: ["#ffffff", "#1a1a1a"],
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80",
    imageBg: "#d4cdc5",
    totalUnits: 50,
    soldUnits: 0,
    isNew: false,
    isDrop: true,
    dropNumber: 4,
    status: "coming_soon",
  },
];

export async function getShopProducts(): Promise<Product[]> {
  const notion = getClient();
  if (!notion) {
    console.warn("[notion-shop] NOTION_SHOP_DATABASE_ID не задан — возвращаю тестовые товары");
    return fallbackProducts;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (notion as any).databases.query({
      database_id: shopDbId!,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.results.map((page: any) => {
      const props = page.properties;
      const statusVal = props.Статус?.select?.name || "В наличии";
      let status: ProductStatus = "available";
      if (statusVal === "Распродано") status = "sold_out";
      else if (statusVal === "Скоро") status = "coming_soon";

      return {
        id: page.id,
        slug: props.Slug?.rich_text?.[0]?.text?.content || page.id,
        name: props.Название?.title?.[0]?.text?.content || "",
        category: props.Категория?.select?.name || "",
        price: props.Цена?.number || 0,
        oldPrice: props["Старая цена"]?.number || undefined,
        description: props.Описание?.rich_text?.[0]?.text?.content || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colors: (props.Цвета?.multi_select || []).map((c: any) => c.name),
        imageUrl: props.Изображение?.url || "",
        imageBg: props.Фон?.rich_text?.[0]?.text?.content || "#f1f0eb",
        totalUnits: props["Всего единиц"]?.number || undefined,
        soldUnits: props.Продано?.number || undefined,
        isNew: props.Новинка?.checkbox || false,
        isDrop: props.Дроп?.checkbox || false,
        dropNumber: props["Номер дропа"]?.number || undefined,
        status,
      };
    });
  } catch (err) {
    console.error("[notion-shop] Ошибка чтения:", err);
    return fallbackProducts;
  }
}
