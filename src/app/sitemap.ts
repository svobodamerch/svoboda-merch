import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Карта сайта. Магазин — отдельное приложение на том же домене,
 * поэтому его разделы перечислены здесь же.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: [string, number, MetadataRoute.Sitemap[0]["changeFrequency"]][] = [
    ["", 1, "weekly"],
    ["/shop", 0.9, "daily"],
    ["/shop/stock", 0.8, "daily"],
    ["/shop/custom", 0.8, "weekly"],
    ["/birka", 0.5, "yearly"],
    ["/legal/offer", 0.3, "yearly"],
    ["/legal/payment", 0.3, "yearly"],
    ["/legal/delivery", 0.3, "yearly"],
    ["/legal/requisites", 0.3, "yearly"],
    ["/legal/privacy", 0.2, "yearly"],
    ["/legal/processing", 0.2, "yearly"],
  ];

  return pages.map(([path, priority, changeFrequency]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
