import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts, createBlogPost } from "@/lib/notion-blog";

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[api/blog] GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, slug, excerpt, content, cover, published } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Заголовок, slug и контент обязательны" },
        { status: 400 }
      );
    }

    const success = await createBlogPost({
      title,
      slug,
      excerpt: excerpt || "",
      content,
      cover,
      published: published ?? true,
    });

    if (success) {
      return NextResponse.json({ success: true }, { status: 201 });
    } else {
      return NextResponse.json(
        { error: "Не удалось создать запись. Проверь NOTION_BLOG_DATABASE_ID" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[api/blog] POST error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
