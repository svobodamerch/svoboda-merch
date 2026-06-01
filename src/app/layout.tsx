import type { Metadata } from "next";
import { Cormorant, Manrope } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const cormorant = Cormorant({
  subsets: ["latin", "cyrillic"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Свобода Мерч — премиальный мерч для брендов",
  description:
    "Создаём одежду, мерч и брендированные вещи для компаний, комьюнити и независимых проектов — от идеи до готового тиража.",
  keywords: [
    "мерч",
    "корпоративный мерч",
    "брендированная одежда",
    "свобода мерч",
    "svoboda.site",
  ],
  openGraph: {
    title: "Свобода Мерч — мерч, который хочется носить",
    description:
      "Премиальный мерч для бизнеса, комьюнити и креаторов.",
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
    <html lang="ru" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="font-body">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
