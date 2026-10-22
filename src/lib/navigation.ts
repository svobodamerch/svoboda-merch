export type NavDropdownItem = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem =
  | { label: string; href: string; dropdown?: undefined; external?: boolean }
  | { label: string; href: string; dropdown: NavDropdownItem[]; external?: boolean };

export const mainNav: NavItem[] = [
  // Магазин пока в разработке: ведём на заглушку (само приложение /shop живёт отдельно)
  { label: "Магазин", href: "/store" },
  { label: "Что производим", href: "/#assortment" },
  { label: "Что делаем", href: "/#services" },
  { label: "Прайс", href: "/#price" },
  { label: "Вопросы", href: "/#faq" },
  { label: "Контакты", href: "/#contact" },
];

export const footerNav = {
  products: [],
  services: [],
  company: [],
};

export const socialLinks = [
  { label: "Telegram", href: "https://t.me/svobodamerch" },
  { label: "VK", href: "https://vk.com/svoboda.site" },
  { label: "Max", href: "https://max.ru/id543306833220_biz" },
  { label: "Instagram", href: "https://www.instagram.com/svoboda.site" },
];

export const siteContact = {
  phone: "+7 (980) 148-48-47",
  phoneHref: "tel:+79801484847",
  email: "mail@svoboda.site",
  emailHref: "mailto:mail@svoboda.site",
  site: "@svoboda.site",
  siteHref: "https://svoboda.site",
};
