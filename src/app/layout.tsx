import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "[СВОБОДА]* — шьём одежду, делаем мерч",
  description:
    "Швейное производство и мерч полного цикла: футболки, худи, рубашки, жилеты, головные уборы, аксессуары. Тираж от 1 единицы. Новосибирск · Москва.",
  keywords: [
    "мерч",
    "корпоративный мерч",
    "брендированная одежда",
    "пошив одежды на заказ",
    "свобода мерч",
    "svoboda.site",
  ],
  openGraph: {
    title: "[СВОБОДА]* — шьём одежду, делаем мерч",
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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
