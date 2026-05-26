# Свобода Мерч

Премиальный B2B-сайт мерча · @svoboda.site. Warm editorial стиль (realthread-inspired).

## Стек

- Next.js App Router · TypeScript · Tailwind CSS v4
- Шрифты: **Unbounded** + **Golos Text** (Google Fonts)

## Дизайн

| Токен | Значение |
|-------|----------|
| Фон | `#F7F5F0` (cream) |
| Текст | `#1A1917` (ink) |
| Акцент | `#E8593C` (warm red) |
| Кнопки | pill `border-radius: 40px` |

## Запуск

```bash
npm install
npm run dev
```

## Страницы

- `/` — главная (11 секций)
- `/cases` — портфолио с фильтрами
- `/blog` — заглушка блога

## Главная: секции

1. Hero  
2. Guarantee block  
3. Our Services  
4. Reviews (horizontal scroll)  
5. Product catalog (tabs)  
6. Category gallery (horizontal scroll)  
7. Brand story  
8. For whom (6 cards)  
9. Lead magnet (гайд)  
10. Brand philosophy  
11. Final CTA + ContactForm  

## Навигация

- Продукция / Услуги — dropdown
- Кейсы · Блог · Заказать образец
- CTA: **Начать проект**

Контент: `src/lib/home-data.ts`, `src/lib/navigation.ts`, `src/lib/cases.ts`

### Свои фото в каталоге

В `src/lib/home-data.ts` у каждого товара поле `image` — замените на пути вида `/images/catalog/футболка-1.jpg` после загрузки файлов в `public/images/catalog/`.
