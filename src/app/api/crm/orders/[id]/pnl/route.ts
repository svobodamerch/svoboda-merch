import { NextRequest, NextResponse } from "next/server";
import {
  getLegalEntity,
  getOrderById,
  getOrderCosts,
  getOrderItems,
  lineTotalKopecks,
  getCrmDb,
} from "@/lib/crm/db";

/**
 * Расклад сделки: по каждой позиции — продажа, себестоимость, маржа; затем
 * налог юрлица и чистая прибыль. Затраты «на проверку» (needs_review) в
 * итог не входят, а показываются отдельно — иначе спорный дубль портит прибыль.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const orderId = Number((await params).id);
  const order = getOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Не найдено" }, { status: 404 });

  const items = getOrderItems(orderId);
  const costs = getOrderCosts(orderId);
  const entity = order.legal_entity_id ? getLegalEntity(order.legal_entity_id) : undefined;

  const db = getCrmDb();
  const received = (
    db
      .prepare(`SELECT COALESCE(SUM(amount_kopecks),0) s FROM payments WHERE order_id = ? AND direction = 'in'`)
      .get(orderId) as { s: number }
  ).s;

  const counted = costs.filter((c) => !c.needs_review);
  const pending = costs.filter((c) => c.needs_review);

  const positions = items.map((it) => {
    const revenue = lineTotalKopecks(it);
    const itemCosts = counted.filter((c) => c.order_item_id === it.id);
    const cost = itemCosts.reduce((s, c) => s + c.amount_kopecks, 0);
    return {
      id: it.id,
      title: it.title,
      quantity: it.quantity,
      unit: it.unit,
      revenueKopecks: revenue,
      costKopecks: cost,
      marginKopecks: revenue - cost,
      marginPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 1000) / 10 : null,
      hasCost: itemCosts.length > 0,
      costs: itemCosts.map((c) => ({ id: c.id, title: c.title, amountKopecks: c.amount_kopecks, status: c.status })),
    };
  });

  const general = counted.filter((c) => !c.order_item_id);
  const generalTotal = general.reduce((s, c) => s + c.amount_kopecks, 0);
  const revenueTotal = positions.reduce((s, p) => s + p.revenueKopecks, 0);
  const costTotal = counted.reduce((s, c) => s + c.amount_kopecks, 0);
  const pendingTotal = pending.reduce((s, c) => s + c.amount_kopecks, 0);

  const preTax = revenueTotal - costTotal;
  let taxKopecks = 0;
  let taxNote = "Юрлицо не выбрано — налог не считается";
  if (entity) {
    if (entity.tax_regime === "usn_income_minus_expense") {
      const byBase = Math.max(0, preTax) * (entity.tax_rate / 100);
      const minTax = revenueTotal * 0.01;
      taxKopecks = Math.round(Math.max(byBase, minTax));
      taxNote = `УСН «доходы минус расходы» ${entity.tax_rate}% с (выручка − затраты), минимум 1% выручки`;
    } else {
      taxKopecks = Math.round(revenueTotal * (entity.tax_rate / 100));
      taxNote = `УСН «доходы» ${entity.tax_rate}% с выручки`;
    }
  }

  return NextResponse.json({
    order: { id: order.id, title: order.title, status: order.status },
    legalEntity: entity ? { id: entity.id, name: entity.short_name, regime: entity.tax_regime, rate: entity.tax_rate } : null,
    positions,
    generalCosts: general.map((c) => ({ id: c.id, title: c.title, amountKopecks: c.amount_kopecks, status: c.status })),
    pendingCosts: pending.map((c) => ({ id: c.id, title: c.title, amountKopecks: c.amount_kopecks, note: c.review_note })),
    totals: {
      revenueKopecks: revenueTotal,
      receivedKopecks: received,
      costKopecks: costTotal,
      generalCostKopecks: generalTotal,
      pendingKopecks: pendingTotal,
      preTaxProfitKopecks: preTax,
      taxKopecks,
      taxNote,
      netProfitKopecks: preTax - taxKopecks,
      netProfitIfPendingCountedKopecks: preTax - pendingTotal - taxKopecks,
      netMarginPercent: revenueTotal > 0 ? Math.round(((preTax - taxKopecks) / revenueTotal) * 1000) / 10 : null,
    },
    missingCostPositions: positions.filter((p) => !p.hasCost).map((p) => p.title),
  });
}
