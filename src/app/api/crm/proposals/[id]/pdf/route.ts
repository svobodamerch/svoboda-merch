import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { getProposalById } from "@/lib/crm/db";

/**
 * PDF — не отдельная вёрстка, а печать той же страницы /kp/[token], что видит
 * клиент: рендерим её headless-браузером, чтобы web и PDF не расходились.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = getProposalById(Number(id));
  if (!proposal) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const base = process.env.SITE_URL || "http://localhost:3000";
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.goto(`${base}/kp/${proposal.token}?internal=1`, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px" } });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="kp-${proposal.token}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
