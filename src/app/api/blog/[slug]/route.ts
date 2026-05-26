import { NextResponse } from "next/server";
import { getBlogPostBySlug } from "@/lib/notion-blog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error("[api/blog/slug] GET error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
