import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const blogDbId = process.env.NOTION_BLOG_DATABASE_ID;

let notionClient: Client | null = null;

function getClient(): Client | null {
  if (!token || !blogDbId) return null;
  if (!notionClient) {
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover?: string;
  published: boolean;
  createdAt: string;
};

// Тестовые статьи — fallback если Notion не настроен
const fallbackPosts: BlogPost[] = [
  {
    id: "test-1",
    title: "Как выбрать мерч, который полюбят сотрудники",
    slug: "kak-vybrat-merch",
    excerpt: "Рассказываем, на что обращать внимание при заказе корпоративной продукции — от материалов до дизайна.",
    content: `## Почему мерч важен

Корпоративный мерч — это не просто вещи с логотипом. Это инструмент вовлечённости, узнаваемости и даже привлечения талантов.

## На что смотреть

1. **Качество материалов** — дешёвая ткань садится после первой стирки
2. **Универсальность дизайна** — мерч должен нравиться не только HR
3. **Практичность** — шопперы носят, а вот ручки теряют

## Примеры из нашей практики

Для одного IT-стартапа мы сделали худи оверсайз с минималистичным логотипом. Ребята носят их не только на работу, но и просто так — лучшая реклама бренда.
`,
    cover: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&q=80",
    published: true,
    createdAt: "2024-03-15",
  },
  {
    id: "test-2",
    title: "Тренды мерча 2024: что заказывают крупные компании",
    slug: "trendy-mercha-2024",
    excerpt: "Обзор самых популярных категорий — от экотоваров до премиум-аксессуаров.",
    content: `## Экотовары

Переработанный пластик, органический хлопок, крафтовая упаковка — клиенты всё чаще спрашивают об устойчивости.

## Премиум-аксессуары

Не только одежда: кожаные портмоне, беспроводные зарядки, термокружки с гравировкой.

## Скорость vs качество

Сроки сжимаются, но качество нельзя терять. Мы оптимизировали процессы и даём расчёт за 1 день.
`,
    cover: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80",
    published: true,
    createdAt: "2024-04-22",
  },
  {
    id: "test-3",
    title: "Кейс: мерч для конференции на 500 человек",
    slug: "keys-merch-dlya-konferencii",
    excerpt: "Как мы за 2 недели разработали, произвели и доставили полный набор продукции.",
    content: `## Задача

Заказчик — крупная конференция по IT. Нужно: футболки, стикеры, бейджи, блокноты, шопперы.

## Сроки

14 дней на всё — от утверждения дизайна до доставки в 3 города.

## Решение

- Параллельная печать на 2 производствах
- Собственный дизайн без правок
- Доставка до двери организаторов

## Результат

500 довольных участников, 0 претензий, заказчик вернулся через полгода.
`,
    cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    published: true,
    createdAt: "2024-05-10",
  },
];

export async function getBlogPosts(): Promise<BlogPost[]> {
  const notion = getClient();
  if (!notion) {
    console.warn("[notion-blog] NOTION_BLOG_DATABASE_ID не задан — возвращаю тестовые статьи");
    return fallbackPosts;
  }

  try {
    const response = await (notion as any).databases.query({
      database_id: blogDbId!,
      filter: {
        property: "Опубликовано",
        checkbox: { equals: true },
      },
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        title: props.Заголовок?.title?.[0]?.text?.content || "",
        slug: props.Slug?.rich_text?.[0]?.text?.content || page.id,
        excerpt: props.Описание?.rich_text?.[0]?.text?.content || "",
        content: props.Контент?.rich_text?.[0]?.text?.content || "",
        cover: props.Обложка?.url || undefined,
        published: props.Опубликовано?.checkbox || false,
        createdAt: props.Дата?.date?.start || page.created_time,
      };
    });
  } catch (err) {
    console.error("[notion-blog] Ошибка чтения:", err);
    return fallbackPosts;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function createBlogPost(data: Omit<BlogPost, "id" | "createdAt">): Promise<boolean> {
  const notion = getClient();
  if (!notion) {
    console.warn("[notion-blog] NOTION_BLOG_DATABASE_ID не задан — запись невозможна");
    return false;
  }

  try {
    await notion.pages.create({
      parent: { database_id: blogDbId! },
      properties: {
        Заголовок: { title: [{ text: { content: data.title } }] },
        Slug: { rich_text: [{ text: { content: data.slug } }] },
        Описание: { rich_text: [{ text: { content: data.excerpt } }] },
        Контент: { rich_text: [{ text: { content: data.content } }] },
        Обложка: { url: data.cover || null },
        Опубликовано: { checkbox: data.published },
        Дата: { date: { start: new Date().toISOString().split("T")[0] } },
      },
    });
    return true;
  } catch (err) {
    console.error("[notion-blog] Ошибка создания:", err);
    return false;
  }
}
