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

export type NotionLead = {
  id: string;
  name: string;
  company: string;
  phone: string;
  productType: string;
  quantity: string;
  comment: string;
  deadline: string;
  status: string;
  createdAt: string;
};

export async function getNotionLeads(): Promise<NotionLead[]> {
  const notion = getClient();
  if (!notion) return [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (notion as any).databases.query({
      database_id: databaseId!,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        name: props.Имя?.title?.[0]?.text?.content || "",
        company: props.Компания?.rich_text?.[0]?.text?.content || "",
        phone: props.Телефон?.phone_number || "",
        productType: props["Тип продукции"]?.select?.name || "",
        quantity: props.Тираж?.rich_text?.[0]?.text?.content || "",
        comment: props.Комментарий?.rich_text?.[0]?.text?.content || "",
        deadline: props.Сроки?.rich_text?.[0]?.text?.content || "",
        status: props.Статус?.select?.name || "Новая",
        createdAt: props["Дата заявки"]?.date?.start || page.created_time,
      };
    });
  } catch (err) {
    console.error("[notion] Ошибка чтения заявок:", err);
    return [];
  }
}

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
