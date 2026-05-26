"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";

export default function AdminBlogPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover: "",
    published: true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
        setForm({
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          cover: "",
          published: true,
        });
      } else {
        alert("Ошибка при создании статьи");
      }
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-heading text-2xl font-medium tracking-tight text-ink md:text-3xl">
        Новая статья
      </h1>

      {success && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Статья создана! Она появится в блоге, если опубликована.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-ink">Заголовок</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="Например: Как выбрать мерч"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Slug (URL)</label>
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="kak-vybrat-merch"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Описание</label>
          <input
            name="excerpt"
            value={form.excerpt}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="Краткое описание для списка"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Обложка (URL)</label>
          <input
            name="cover"
            value={form.cover}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="https://images.unsplash.com/photo-..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Контент</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            rows={10}
            className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            placeholder="Текст статьи... Поддерживаются переносы строк."
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="published"
            checked={form.published}
            onChange={handleChange}
          />
          Опубликовать сразу
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? "Создание…" : "Создать статью"}
        </button>
      </form>
    </Container>
  );
}
