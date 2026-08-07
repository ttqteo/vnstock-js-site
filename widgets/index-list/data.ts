import { getIndexHistory } from "@/lib/board";

const INDICES: { symbol: string; label: string }[] = [
  { symbol: "VNINDEX", label: "VNINDEX" },
  { symbol: "VN30", label: "VN30" },
  { symbol: "HNXIndex", label: "HNX" },
  { symbol: "HNXUpcomIndex", label: "UPCOM" },
];

export interface IndexRow {
  symbol: string;
  label: string;
  close: number;
  change: number;
  changePercent: number;
  spark: number[];
}

export async function getIndexList(): Promise<IndexRow[]> {
  const rows = await Promise.all(
    INDICES.map(async ({ symbol, label }) => {
      const bars = await getIndexHistory(symbol, 30);
      if (bars.length < 2) return null;
      const last = bars[bars.length - 1];
      const prev = bars[bars.length - 2];
      return {
        symbol,
        label,
        close: last.close,
        change: last.close - prev.close,
        changePercent: prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0,
        spark: bars.map((b) => b.close),
      };
    })
  );
  return rows.filter((r): r is IndexRow => r !== null);
}
