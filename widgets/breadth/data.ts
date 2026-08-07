import { getOverview, type Exchange } from "@/lib/board";

export interface BreadthData {
  date: string;
  advancing: number;
  declining: number;
  unchanged: number;
  ceiling: number;
  floor: number;
  total: number;
}

export async function getBreadth(exchange: Exchange): Promise<BreadthData> {
  const ov = await getOverview(exchange);
  const b = ov.breadth;
  return {
    date: b.date,
    advancing: b.advancing,
    declining: b.declining,
    unchanged: b.unchanged,
    ceiling: b.ceiling,
    floor: b.floor,
    total: b.total,
  };
}
