import type { Metadata } from "next";
import { ConstructorPage } from "@/components/constructor/ConstructorPage";
import { PageHero } from "@/components/pages/PageHero";

export const metadata: Metadata = {
  title: "Конструктор дизайна — Свобода Мерч",
  description:
    "Соберите свой принт онлайн: добавьте текст или фото на футболку и отправьте заявку на просчёт тиража.",
};

export default function ConstructorRoute() {
  return (
    <>
      <PageHero
        eyebrow="Собери свой мерч"
        title="Конструктор дизайна"
        description="Добавьте текст или своё изображение на футболку — отправим цену за тираж и поможем довести макет до печати."
      />
      <ConstructorPage />
    </>
  );
}
