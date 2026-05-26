import { NextResponse } from "next/server";
import { getNotionLeads } from "@/lib/notion";

export async function GET() {
  try {
    const leads = await getNotionLeads();
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[api/notion-leads] GET error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
