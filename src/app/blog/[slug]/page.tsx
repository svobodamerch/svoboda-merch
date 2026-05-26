import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/notion-blog";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Свобода Мерч`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="bg-paper py-14 md:py-20">
      <Container className="max-w-3xl">
        <Link
          href="/blog"
          className="text-sm text-muted transition-colors hover:text-accent"
        >
          ← Назад к блогу
        </Link>

        {post.cover && (
          <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        <h1 className="mt-8 font-heading text-3xl font-medium tracking-tight text-ink md:text-4xl">
          {post.title}
        </h1>
        <span className="mt-3 block text-sm text-muted">
          {new Date(post.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>

        {post.excerpt && (
          <p className="mt-6 text-lg leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        <div className="prose mt-10 max-w-none whitespace-pre-wrap leading-relaxed text-ink">
          {post.content}
        </div>
      </Container>
    </article>
  );
}
