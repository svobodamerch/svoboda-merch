"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getShopProducts, type Product, type ProductStatus } from "@/lib/notion-shop";

const heroVideoUrl =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ||
  "https://cdn.coverr.co/videos/coverr-typing-on-a-laptop-2085/1080p.mp4";
const heroPosterUrl =
  process.env.NEXT_PUBLIC_HERO_POSTER_URL ||
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1600&q=80";

const CATEGORIES = ["Все", "Футболки", "Худи", "Кепки", "Шопперы", "Блокноты", "Дропы"];

const STATUS_BADGES: Record<ProductStatus, { text: string; className: string }> = {
  available: { text: "", className: "" },
  sold_out: { text: "Распродано", className: "bg-black/60 text-white" },
  coming_soon: { text: "Скоро", className: "bg-white/80 text-black" },
};

function formatPrice(n: number) {
  return n.toLocaleString("ru-RU") + " ₽";
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    getShopProducts().then((data) => {
      if (mounted) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "Все") return products;
    if (activeCategory === "Дропы") return products.filter((p) => p.isDrop);
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  function toggleWishlist(id: string) {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addToCart(id: string) {
    setCart((prev) => new Set(prev).add(id));
  }

  return (
    <main
      className="min-h-screen bg-white"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* Hero Video */}
      <section className="px-4 pt-4">
        <div
          className="relative mx-auto w-full overflow-hidden"
          style={{ aspectRatio: "16/7", borderRadius: 20 }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={heroPosterUrl}
            className="h-full w-full object-cover"
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative mx-4 mt-4 overflow-hidden" style={{ borderRadius: 18, aspectRatio: "16/6" }}>
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-40"
          style={{ background: "#f59e0b", filter: "blur(100px)" }}
        />
        <div
          className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-30"
          style={{ background: "#3b82f6", filter: "blur(100px)" }}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#c9a96e" }}>
            Свобода Мерч
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Одень свободу
          </h1>
          <p className="mt-3 max-w-md text-sm text-white/60 sm:text-base">
            Премиальный мерч для тех, кто ценит качество и смысл. Лимитированные дропы каждый сезон.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105"
              onClick={() => document.getElementById("shop-grid")?.scrollIntoView({ behavior: "smooth" })}
            >
              Смотреть коллекцию
            </button>
            <button
              className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-blue-400 transition-colors hover:bg-white/5"
              onClick={() => setActiveCategory("Дропы")}
            >
              Дропы
            </button>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <div className="sticky top-[72px] z-30 mt-8 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4">
          <div
            className="flex gap-2 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-[#f1f0eb] text-[#1a1a1a] hover:bg-[#e5e4df]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <section id="shop-grid" className="mx-auto max-w-7xl px-4 pb-20 pt-6">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400">Товары не найдены</div>
        ) : (
          <div
            className="grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((product) => {
              const stockPercent =
                product.totalUnits && product.soldUnits !== undefined
                  ? Math.min(100, (product.soldUnits / product.totalUnits) * 100)
                  : 0;
              const remaining =
                product.totalUnits && product.soldUnits !== undefined
                  ? product.totalUnits - product.soldUnits
                  : undefined;
              const isWished = wishlist.has(product.id);
              const inCart = cart.has(product.id);

              return (
                <div
                  key={product.id}
                  className="group relative cursor-pointer"
                  style={{
                    transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Card */}
                  <div
                    className="overflow-hidden bg-white"
                    style={{
                      borderRadius: 18,
                      border: "0.5px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* Image Area */}
                    <div
                      className="relative overflow-hidden"
                      style={{ aspectRatio: "1/1", backgroundColor: product.imageBg }}
                    >
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-[400ms] group-hover:scale-[1.03]"
                        style={{
                          transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        }}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />

                      {/* Badges */}
                      <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
                        {product.isNew && (
                          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black backdrop-blur-sm">
                            New
                          </span>
                        )}
                        {product.isDrop && product.dropNumber && product.status !== "sold_out" && (
                          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                            Дроп №{product.dropNumber}
                          </span>
                        )}
                        {product.status !== "available" && STATUS_BADGES[product.status].text && (
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm ${STATUS_BADGES[product.status].className}`}
                          >
                            {STATUS_BADGES[product.status].text}
                          </span>
                        )}
                      </div>

                      {/* Wishlist */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                        style={{ transition: "opacity 0.3s" }}
                      >
                        <svg
                          width={16}
                          height={16}
                          viewBox="0 0 24 24"
                          fill={isWished ? "#ef4444" : "none"}
                          stroke={isWished ? "#ef4444" : "#1a1a1a"}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>

                      {/* Quick-add cart */}
                      {product.status === "available" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product.id);
                          }}
                          className="absolute bottom-2.5 right-2.5 flex h-8 items-center gap-1 rounded-full bg-white/90 px-3 text-xs font-medium text-black opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                          style={{ transition: "opacity 0.3s" }}
                        >
                          {inCart ? (
                            <>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              В корзине
                            </>
                          ) : (
                            <>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              В корзину
                            </>
                          )}
                        </button>
                      )}

                      {/* Stock strip */}
                      {product.totalUnits && product.soldUnits !== undefined && product.status === "available" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/10">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="p-3">
                      {/* Category */}
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                        {product.category}
                      </p>

                      {/* Name */}
                      <h3 className="mt-1 text-sm font-medium tracking-tight text-[#1a1a1a]">
                        {product.name}
                      </h3>

                      {/* Description */}
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-400">
                        {product.description}
                      </p>

                      {/* Color swatches */}
                      {product.colors.length > 0 && (
                        <div className="mt-2.5 flex gap-1.5">
                          {product.colors.map((color, i) => (
                            <div
                              key={i}
                              className="h-[13px] w-[13px] rounded-full border border-black/10 transition-transform hover:scale-125"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}

                      {/* Stock urgency */}
                      {remaining !== undefined && remaining < 20 && remaining > 0 && (
                        <p className="mt-2 text-xs font-medium text-red-500">
                          Осталось {remaining} штук
                        </p>
                      )}

                      {/* Price + CTA */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-[#1a1a1a]">
                            {formatPrice(product.price)}
                          </span>
                          {product.oldPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(product.oldPrice)}
                            </span>
                          )}
                        </div>
                        {product.status === "available" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product.id);
                            }}
                            className="rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
                            style={{ borderRadius: 980 }}
                          >
                            {inCart ? "Добавлено" : "В корзину"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
