export function formatMoney(kopecks: number): string {
  const rubles = kopecks / 100;
  return `${rubles.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

export function toKopecks(rublesInput: string | number): number {
  const rubles = typeof rublesInput === "string" ? parseFloat(rublesInput.replace(",", ".")) : rublesInput;
  if (!Number.isFinite(rubles)) return 0;
  return Math.round(rubles * 100);
}
