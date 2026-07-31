import { siteContact } from "@/lib/navigation";

/**
 * Разметка данных для поисковиков (JSON-LD).
 *
 * Это то, из чего Яндекс и Google понимают, что мы за организация,
 * где работаем и по каким ценам. Даёт расширенные сниппеты в выдаче
 * и связывает сайт с карточкой компании.
 *
 * Важно: сюда попадает только то, что подтверждено. Точный адрес
 * производства не указан намеренно — публиковать непроверенный
 * хуже, чем не указывать вовсе: местная выдача накажет за расхождение
 * с карточкой в справочниках.
 */

export const SITE_URL = "https://svoboda.site";

const PHONE_E164 = siteContact.phoneHref.replace("tel:", "");

/** Организация: кто мы, как связаться, где работаем */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "[СВОБОДА]*",
    alternateName: "Свобода Мерч",
    url: SITE_URL,
    description:
      "Швейное производство полного цикла и сувенирная продукция: одежда под брендом заказчика, мерч с логотипом, коллаборации.",
    telephone: PHONE_E164,
    email: siteContact.email,
    foundingDate: "2016",
    areaServed: [
      { "@type": "City", name: "Новосибирск" },
      { "@type": "City", name: "Москва" },
      { "@type": "Country", name: "Россия" },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "RU",
      addressLocality: "Новосибирск",
    },
    sameAs: [
      "https://t.me/svobodamerch",
      "https://vk.com/svoboda.site",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE_E164,
      contactType: "sales",
      areaServed: "RU",
      availableLanguage: "Russian",
    },
  };
}

/** Сайт целиком — помогает показать название в выдаче */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "[СВОБОДА]* — швейное производство и мерч",
    inLanguage: "ru-RU",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export interface OfferInput {
  name: string;
  spec: string;
  prices: number[];
}

/**
 * Каталог услуг с ценами «от».
 *
 * Цены указываем минимальные по тиражу и помечаем как ориентировочные —
 * иначе поисковик покажет в сниппете цену, к которой нас будут привязывать.
 */
export function catalogSchema(groups: { title: string; rows: OfferInput[] }[]) {
  const items = groups.flatMap((g) =>
    g.rows.map((r) => ({
      "@type": "Offer",
      name: r.name,
      description: r.spec,
      category: g.title,
      price: Math.min(...r.prices),
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: Math.min(...r.prices),
        maxPrice: Math.max(...r.prices),
        priceCurrency: "RUB",
        valueAddedTaxIncluded: true,
      },
      seller: { "@id": `${SITE_URL}/#organization` },
    })),
  );

  return {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Прайс на пошив и мерч",
    itemListElement: items,
  };
}

/** Частые вопросы — занимают место в выдаче и отвечают до перехода */
export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

/** Вставка разметки в страницу */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Данные наши собственные, не пользовательский ввод
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
