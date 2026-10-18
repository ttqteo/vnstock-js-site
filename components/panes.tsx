// Each pane is the content of one route; the page file only passes searchParams in.
import { Suspense } from "react";
import { BoardTable } from "@/components/board-table";
import { PriceChart } from "@/components/chart";
import { Panel, PanelError, PanelSkeleton } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WidgetGrid, WidgetSlot } from "@/components/widget-grid";
import { getBoard, getStockHistory, type Exchange } from "@/lib/board";
import { Breadth } from "@/widgets/breadth";
import { ForeignFlow } from "@/widgets/foreign-flow";
import { Heatmap } from "@/widgets/heatmap";
import { IndexChart } from "@/widgets/index-chart";
import { chartBarCount, DEFAULT_RANGE, INDEX_SYMBOLS, RANGES } from "@/widgets/index-chart/data";
import { MoneyFlow } from "@/widgets/money-flow";

const EXCHANGES = ["HOSE", "HNX", "UPCOM"] as const;

function ExchangeTabs({ exchange, basePath }: { exchange: Exchange; basePath: string }) {
  return (
    <div className="flex items-center bg-card px-2 py-1.5">
      <Tabs
        items={EXCHANGES.map((e) => ({
          label: e === "HOSE" ? "HSX" : e,
          href: `${basePath}?ex=${e}`,
          active: e === exchange,
        }))}
      />
    </div>
  );
}

/* Adding a widget = one WidgetSlot here; Suspense per cell so each streams
   and fails on its own. */
export function MarketPane({ exchange }: { exchange: Exchange }) {
  return (
    <>
      <ExchangeTabs exchange={exchange} basePath="/" />
      <WidgetGrid className="grid flex-1 gap-px bg-border md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-[auto_minmax(0,1fr)]">
        <WidgetSlot id="breadth">
          <Suspense key={`breadth-${exchange}`} fallback={<PanelSkeleton title="Độ rộng" />}>
            <Breadth exchange={exchange} />
          </Suspense>
        </WidgetSlot>
        <WidgetSlot id="money-flow">
          <Suspense key={`money-${exchange}`} fallback={<PanelSkeleton title="Dòng tiền" />}>
            <MoneyFlow exchange={exchange} />
          </Suspense>
        </WidgetSlot>
        <WidgetSlot id="foreign-flow">
          <Suspense key={`foreign-${exchange}`} fallback={<PanelSkeleton title="Khối ngoại" />}>
            <ForeignFlow exchange={exchange} />
          </Suspense>
        </WidgetSlot>
        <WidgetSlot id="heatmap" className="md:col-span-2 xl:col-span-3">
          <Suspense key={`heat-${exchange}`} fallback={<PanelSkeleton title="Bản đồ ngành" />}>
            <Heatmap exchange={exchange} />
          </Suspense>
        </WidgetSlot>
      </WidgetGrid>
    </>
  );
}

export function ChartPane({ symbol }: { symbol: string }) {
  return (
    <>
      <form action="/bieu-do" className="flex items-center gap-1.5 bg-card px-2 py-1.5">
        <Input name="ma" defaultValue={symbol} placeholder="Mã hoặc chỉ số" className="h-7 w-40" autoComplete="off" />
        <Button type="submit" size="sm" variant="outline">
          Xem
        </Button>
      </form>
      <Suspense key={symbol} fallback={<PanelSkeleton title={symbol} className="flex-1" />}>
        <SymbolChart symbol={symbol} />
      </Suspense>
    </>
  );
}

async function SymbolChart({ symbol }: { symbol: string }) {
  if (INDEX_SYMBOLS.includes(symbol)) return <IndexChart fill symbol={symbol} />;

  let bars;
  try {
    bars = await getStockHistory(symbol, chartBarCount());
  } catch {
    return <PanelError title={symbol} />;
  }
  if (bars.length === 0) return <PanelError title={symbol} />;

  return (
    <Panel title={`${symbol} · nến ngày`} className="flex-1" pad={false}>
      <PriceChart
        candles={bars.map((b) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close }))}
        volumes={bars.map((b) => ({ time: b.date, value: b.volume, up: b.close >= b.open }))}
        ranges={RANGES}
        initialRange={DEFAULT_RANGE}
        height={320}
        fill
      />
    </Panel>
  );
}

export function BoardPane({ exchange }: { exchange: Exchange }) {
  return (
    <>
      <ExchangeTabs exchange={exchange} basePath="/bang-gia" />
      <Suspense
        key={exchange}
        fallback={<PanelSkeleton title={`Bảng giá ${exchange}`} className="h-[70vh]" />}
      >
        <Board exchange={exchange} />
      </Suspense>
    </>
  );
}

async function Board({ exchange }: { exchange: Exchange }) {
  let items;
  try {
    items = await getBoard(exchange);
  } catch {
    return <PanelError title={`Bảng giá ${exchange}`} />;
  }

  const sorted = [...items].sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <Panel
      title={`Bảng giá ${exchange}`}
      pad={false}
      right={
        <span className="num text-[12px] text-muted-foreground">
          {sorted.length} mã · cập nhật mỗi 60s
        </span>
      }
    >
      <BoardTable items={sorted} />
    </Panel>
  );
}
