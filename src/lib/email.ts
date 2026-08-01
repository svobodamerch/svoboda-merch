import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "mail@svoboda.site";
const MANAGER_EMAIL = process.env.MANAGER_EMAIL || "mail@svoboda.site";

function getTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export type LeadEmailData = {
  name: string;
  company?: string;
  phone: string;
  productType: string;
  quantity: string;
  comment?: string;
  deadline?: string;
};

export type EmailAttachment = { filename: string; content: Buffer };

export async function sendManagerNotification(
  data: LeadEmailData,
  attachments?: EmailAttachment[],
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP не настроен — письмо менеджеру не отправлено");
    return false;
  }

  const company = data.company ? ` (${data.company})` : "";
  const deadline = data.deadline ? `\nСроки: ${data.deadline}` : "";
  const comment = data.comment ? `\nКомментарий: ${data.comment}` : "";

  const text = `Новая заявка с сайта svoboda.site

Имя: ${data.name}${company}
Телефон: ${data.phone}
Тип продукции: ${data.productType}
Тираж: ${data.quantity}${deadline}${comment}

—
CRM: http://localhost:3000/admin/leads`;

  try {
    await transporter.sendMail({
      from: `"Свобода Мерч" <${FROM_EMAIL}>`,
      to: MANAGER_EMAIL,
      subject: `Заявка: ${data.company || data.name}`,
      text,
      attachments,
    });
    return true;
  } catch (err) {
    console.error("[email] Ошибка отправки менеджеру:", err);
    return false;
  }
}

export async function sendAutoReply(data: LeadEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[email] SMTP не настроен — автоответ не отправлен");
    return false;
  }

  // У нас нет email клиента в форме, поэтому автоответ не отправим.
  // Если добавите поле email — раскомментируйте.
  console.log("[email] Автоответ пропущен — нет email клиента в заявке");
  return false;
}
