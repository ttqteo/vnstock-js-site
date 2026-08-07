import { getIndexHistory, type QuoteHistory } from "@/lib/board";
import { sma } from "@/lib/vnstock";
import type { ChartCandle, ChartLine, ChartVolume, RangeSpec } from "@/components/chart";

/** Five years of daily bars in one fetch; range buttons only move the
 * chart viewport, so panning left reveals older history. */
export const RANGES: RangeSpec[] = [
  { label: "1m", bars: 22 },
  { label: "3m", bars: 66 },
  { label: "6m", bars: 132 },
  { label: "1y", bars: 260 },
  { label: "5y", bars: 1250 },
];

export const DEFAULT_RANGE = "3m";

const VISIBLE = 1250;
const MA_WARMUP = 50;

export interface IndexChartData {
  candles: ChartCandle[];
  volumes: ChartVolume[];
  lines: ChartLine[];
  close: number;
  change: number;
  changePercent: number;
  date: string;
}

export async function getIndexChart(): Promise<IndexChartData | null> {
  const bars = await getIndexHistory("VNINDEX", VISIBLE + MA_WARMUP);
  if (bars.length < 2) return null;

  // Warmup bars exist so MA50 has a value on the first visible bar.
  const ma10 = toLine(sma(bars, { period: 10 }), "#60a5fa", "MA10");
  const ma50 = toLine(sma(bars, { period: 50 }), "#f59e0b", "MA50");
  const shown = bars.slice(-VISIBLE);

  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];

  return {
    candles: shown.map((b) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close })),
    volumes: shown.map((b) => ({ time: b.date, value: b.volume, up: b.close >= b.open })),
    lines: [ma10, ma50],
    close: last.close,
    change: last.close - prev.close,
    changePercent: prev.close > 0 ? ((last.close - prev.close) / prev.close) * 100 : 0,
    date: last.date,
  };
}

/** Also used by the stock page: bars for the widest range plus warmup. */
export function chartBarCount(): number {
  return VISIBLE + MA_WARMUP;
}

function toLine(
  result: { date: string; sma: number | null }[],
  color: string,
  label: string
): ChartLine {
  return {
    color,
    label,
    points: result
      .slice(-VISIBLE)
      .filter((r): r is { date: string; sma: number } => r.sma !== null)
      .map((r) => ({ time: r.date, value: r.sma })),
  };
}
