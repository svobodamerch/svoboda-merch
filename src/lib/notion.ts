import { Client } from "@notionhq/client";

const token = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

let notionClient: Client | null = null;

function getClient(): Client | null {
  if (!token || !databaseId) return null;
  if (!notionClient) {
    notionClient = new Client({ auth: token });
  }
  return notionClient;
}

export type LeadNotionData = {
  name: string;
  company?: string;
  phone: string;
  productType: string;
  quantity: string;
  comment?: string;
  deadline?: string;
};

export async function createNotionLead(data: LeadNotionData): Promise<boolean> {
  const notion = getClient();
  if (!notion) {
    console.warn("[notion] NOTION_TOKEN или NOTION_DATABASE_ID не заданы — пропускаю");
    return false;
  }

  try {
    await notion.pages.create({
      parent: { database_id: databaseId! },
      properties: {
        Имя: {
          title: [{ text: { content: data.name } }],
        },
        Компания: {
          rich_text: [{ text: { content: data.company || "" } }],
        },
        Телефон: {
          phone_number: data.phone,
        },
        "Тип продукции": {
          select: data.productType ? { name: data.productType } : null,
        },
        Тираж: {
          rich_text: [{ text: { content: data.quantity } }],
        },
        Сроки: {
          rich_text: [{ text: { content: data.deadline || "" } }],
        },
        Комментарий: {
          rich_text: [{ text: { content: data.comment || "" } }],
        },
        Статус: {
          select: { name: "Новая" },
        },
        "Дата заявки": {
          date: { start: new Date().toISOString().split("T")[0] },
        },
      },
    });
    console.log("[notion] Заявка добавлена в Notion");
    return true;
  } catch (err) {
    console.error("[notion] Ошибка создания записи:", err);
    return false;
  }
}
