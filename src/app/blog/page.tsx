import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { getBlogPosts } from "@/lib/notion-blog";

export const metadata: Metadata = {
  title: "Блог — Свобода Мерч",
  description: "Статьи о мерче, брендинге и производстве одежды.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="bg-paper py-14 md:py-20">
      <Container>
        <h1 className="font-heading text-3xl font-medium tracking-tight text-ink md:text-4xl">
          Блог
        </h1>
        <p className="mt-3 text-muted">
          Делимся опытом о мерче, брендинге и производстве
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-sm"
            >
              {post.cover && (
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={post.cover}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs text-muted">
                  {new Date(post.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <h2 className="mt-2 font-heading text-lg font-medium leading-snug text-ink group-hover:text-accent">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                    {post.excerpt}
                  </p>
                )}
                <span className="mt-auto pt-4 text-sm font-medium text-accent">
                  Читать →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="mt-16 text-center text-muted">
            Пока нет статей. Первая скоро появится.
          </div>
        )}
      </Container>
    </section>
  );
}
