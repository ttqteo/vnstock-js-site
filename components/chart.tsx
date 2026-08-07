"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  type IChartApi,
} from "lightweight-charts";
import { COLORS } from "@/lib/colors";

export interface ChartCandle {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartVolume {
  time: string;
  value: number;
  up: boolean;
}

export interface ChartLine {
  color: string;
  /** Shown in the legend above the chart; omit to draw the line unlabelled. */
  label?: string;
  points: { time: string; value: number }[];
}

export interface RangeSpec {
  label: string;
  bars: number;
}

/** lightweight-charts wrapper. The server sends the full history; range
 * buttons only move the viewport, so panning left keeps revealing older
 * bars. `candles` and `volumes` must be parallel arrays. */
export function PriceChart({
  candles,
  volumes,
  lines = [],
  height = 320,
  fill = false,
  ranges,
  initialRange,
}: {
  candles: ChartCandle[];
  volumes?: ChartVolume[];
  lines?: ChartLine[];
  height?: number;
  /** Fill the parent's height instead of a fixed pixel height. */
  fill?: boolean;
  ranges?: RangeSpec[];
  initialRange?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [active, setActive] = useState(initialRange ?? ranges?.[0]?.label);
  const activeRef = useRef(active);
  activeRef.current = active;
  const [themeTick, setThemeTick] = useState(0);

  // Canvas cannot follow CSS: rebuild when the theme class flips.
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeTick((t) => t + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const applyRange = (chart: IChartApi, label: string | undefined) => {
    const spec = ranges?.find((r) => r.label === label);
    if (!spec || spec.bars >= candles.length) {
      chart.timeScale().fitContent();
    } else {
      chart.timeScale().setVisibleLogicalRange({
        from: candles.length - spec.bars - 0.5,
        to: candles.length + 1.5,
      });
    }
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || candles.length === 0) return;

    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const gridColor = token("--chart-grid", "#1a212c");
    const borderColor = token("--border", "#232b38");

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: token("--muted-foreground", COLORS.muted),
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: false },
      crosshair: { horzLine: { labelBackgroundColor: borderColor }, vertLine: { labelBackgroundColor: borderColor } },
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: COLORS.up,
      downColor: COLORS.down,
      wickUpColor: COLORS.up,
      wickDownColor: COLORS.down,
      borderVisible: false,
    });
    candleSeries.setData(candles);

    if (volumes && volumes.length > 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: "volume",
        priceFormat: { type: "volume" },
        priceLineVisible: false,
        lastValueVisible: false,
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      const volUp = token("--chart-vol-up", "#14532d");
      const volDown = token("--chart-vol-down", "#7f1d1d");
      volumeSeries.setData(
        volumes.map((v) => ({ time: v.time, value: v.value, color: v.up ? volUp : volDown }))
      );
    }

    for (const line of lines) {
      const s = chart.addSeries(LineSeries, {
        color: line.color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      s.setData(line.points);
    }

    applyRange(chart, activeRef.current);

    return () => {
      chartRef.current = null;
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, volumes, lines, themeTick]);

  // Range clicks only move the viewport on the existing chart.
  useEffect(() => {
    if (chartRef.current) applyRange(chartRef.current, active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const legend = lines.filter((l) => l.label);
  const hasRanges = ranges && ranges.length > 0;

  return (
    <div className={fill ? "flex h-full flex-col" : undefined}>
      {(legend.length > 0 || hasRanges) && (
        <div className="flex items-center justify-between gap-2 p-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-1">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
          {hasRanges && (
            <div className="inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5">
              {ranges.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setActive(r.label)}
                  className={`rounded-[5px] px-2 py-0.5 text-[12px] font-medium transition-colors ${
                    r.label === active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div ref={ref} style={fill ? undefined : { height }} className={fill ? "min-h-0 w-full flex-1" : "w-full"} />
    </div>
  );
}
