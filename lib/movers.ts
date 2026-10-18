import type { PriceBoardItem } from "@/lib/board";

type Row = Pick<PriceBoardItem, "symbol" | "price" | "referencePrice" | "totalVolume">;

/** Percent change vs reference; 0 before the first match so it never reads as -100%. */
export function changePct(item: Row): number {
  if (item.price <= 0 || item.referencePrice <= 0) return 0;
  return ((item.price - item.referencePrice) / item.referencePrice) * 100;
}

export function topMovers<T extends Row>(items: T[], direction: "up" | "down", limit: number): T[] {
  const sign = direction === "up" ? 1 : -1;
  return items
    .filter((i) => i.totalVolume > 0 && sign * changePct(i) > 0)
    .sort((a, b) => sign * (changePct(b) - changePct(a)))
    .slice(0, limit);
}
