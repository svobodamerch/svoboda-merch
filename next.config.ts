import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Собираем в отдельный каталог, чтобы не удалять .next под работающим
  // сервером: он читает чанки с диска лениво, и во время пересборки сайт
  // отдаёт 502. Готовую сборку деплой подменяет одним mv. См. deploy.sh
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
