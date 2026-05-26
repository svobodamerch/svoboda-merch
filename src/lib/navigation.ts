export type NavDropdownItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem =
  | { label: string; href: string; dropdown?: undefined }
  | { label: string; href: string; dropdown: NavDropdownItem[] };

export const mainNav: NavItem[] = [
  { label: "Продукция", href: "/catalog" },
  { label: "Услуги", href: "/production" },
  { label: "Кейсы", href: "/cases" },
  { label: "Блог", href: "/blog" },
  { label: "Заказать образец", href: "/#sample" },
];

export const footerNav = {
  products: [
    { label: "Каталог", href: "/catalog" },
    { label: "Футболки", href: "/catalog" },
    { label: "Худи", href: "/catalog" },
    { label: "Свитшоты", href: "/catalog" },
    { label: "Шопперы", href: "/catalog" },
    { label: "Кепки", href: "/catalog" },
  ],
  services: [
    { label: "Печать", href: "/production" },
    { label: "Вышивка", href: "/production" },
    { label: "Кастомизация", href: "/production" },
    { label: "Упаковка", href: "/production" },
    { label: "Как мы работаем", href: "/process" },
  ],
  company: [
    { label: "Для бизнеса", href: "/business" },
    { label: "Для комьюнити", href: "/community" },
    { label: "Кейсы", href: "/cases" },
    { label: "О нас", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Контакты", href: "/#contact" },
  ],
};

export const socialLinks = [
  { label: "Telegram", href: "https://t.me/svobodamerch" },
  { label: "VK", href: "https://vk.com/" },
  { label: "Max", href: "https://t.me/max_svoboda" },
  { label: "Instagram", href: "https://instagram.com/" },
];

export const siteContact = {
  phone: "+7 (980) 148-48-47",
  phoneHref: "tel:+79801484847",
  email: "mail@svoboda.site",
  emailHref: "mailto:mail@svoboda.site",
  site: "@svoboda.site",
  siteHref: "https://svoboda.site",
};
