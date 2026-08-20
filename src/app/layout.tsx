import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LeadModalProvider } from "@/components/ui/LeadModalProvider";
import { JsonLd, organizationSchema, websiteSchema, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  // Подтверждение прав в Яндекс.Вебмастере — дублирует файл в public/
  verification: { yandex: "cc603d91235bfb2f" },
  title: "[СВОБОДА]* — шьём одежду, печатаем мерч",
  description:
    "Швейное производство и сувенирная продукция полного цикла: футболки, худи, рубашки, жилеты, головные уборы, сувенирка. Тираж от 1 единицы. Москва · Новосибирск.",
  keywords: [
    "мерч",
    "корпоративный мерч",
    "брендированная одежда",
    "пошив одежды на заказ",
    "свобода мерч",
    "svoboda.site",
  ],
  openGraph: {
    title: "[СВОБОДА]* — шьём одежду, печатаем мерч",
    description:
      "Своё производство: от эскиза до тиража. Шьём одежду под вашим брендом и делаем мерч с вашим логотипом.",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Кто мы — для поисковиков. Один раз на весь сайт */}
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        <LeadModalProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </LeadModalProvider>
      </body>
    </html>
  );
}
