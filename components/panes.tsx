// Each pane is the content of one route; the page file only passes searchParams in.
import { Suspense } from "react";
import { BoardTable } from "@/components/board-table";
import { PriceChart } from "@/components/chart";
import { Panel, PanelError, PanelSkeleton } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WidgetGrid, WidgetSlot } from "@/components/widget-grid";
import { getBoard, getIndustryMap, getStockHistory, type Exchange } from "@/lib/board";
import { BOARD_GROUPS, byIndustry, industriesOf, type BoardGroup } from "@/lib/board-filter";
import { Breadth } from "@/widgets/breadth";
import { ForeignFlow } from "@/widgets/foreign-flow";
import { Heatmap } from "@/widgets/heatmap";
import { IndexChart } from "@/widgets/index-chart";
import { chartBarCount, DEFAULT_RANGE, INDEX_SYMBOLS, RANGES } from "@/widgets/index-chart/data";
import { MoneyFlow } from "@/widgets/money-flow";

const EXCHANGES = ["HOSE", "HNX", "UPCOM"] as const;

function ExchangeTabs({
  exchange,
  basePath,
  noActive,
}: {
  exchange: Exchange;
  basePath: string;
  noActive?: boolean;
}) {
  return (
    <Tabs
      items={EXCHANGES.map((e) => ({
        label: e === "HOSE" ? "HSX" : e,
        href: `${basePath}?ex=${e}`,
        active: !noActive && e === exchange,
      }))}
    />
  );
}

/* Adding a widget = one WidgetSlot here; Suspense per cell so each streams
   and fails on its own. */
export function MarketPane({ exchange }: { exchange: Exchange }) {
  return (
    <>
      <div className="flex items-center bg-card px-2 py-1.5">
        <ExchangeTabs exchange={exchange} basePath="/" />
      </div>
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

export function BoardPane({
  exchange,
  group,
  industry,
}: {
  exchange: Exchange;
  group?: BoardGroup;
  industry?: string;
}) {
  const source = group ?? exchange;
  const key = `${source}-${industry ?? ""}`;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 bg-card px-2 py-1.5">
        <ExchangeTabs exchange={exchange} basePath="/bang-gia" noActive={!!group} />
        <Tabs
          items={BOARD_GROUPS.map((g) => ({
            label: g,
            href: `/bang-gia?nhom=${g}`,
            active: g === group,
          }))}
        />
        <Suspense key={`filter-${key}`} fallback={null}>
          <IndustryFilter exchange={exchange} group={group} industry={industry} />
        </Suspense>
      </div>
      <Suspense
        key={key}
        fallback={<PanelSkeleton title={boardTitle(source, industry)} className="h-[70vh]" />}
      >
        <Board source={source} industry={industry} />
      </Suspense>
    </>
  );
}

function boardTitle(source: Exchange | BoardGroup, industry: string | undefined) {
  return industry ? `Bảng giá ${source} · ${industry}` : `Bảng giá ${source}`;
}

/* Offers only the industries present in this exchange or group, and renders
   nothing when the lookup fails so the board itself still shows. */
async function IndustryFilter({
  exchange,
  group,
  industry,
}: {
  exchange: Exchange;
  group?: BoardGroup;
  industry?: string;
}) {
  let industries;
  try {
    const [rows, industryMap] = await Promise.all([getBoard(group ?? exchange), getIndustryMap()]);
    industries = industriesOf(rows.map((r) => r.symbol), industryMap);
  } catch {
    return null;
  }
  if (industries.length === 0) return null;

  return (
    <form action="/bang-gia" className="flex items-center gap-1.5">
      {group ? <input type="hidden" name="nhom" value={group} /> : <input type="hidden" name="ex" value={exchange} />}
      <select
        name="nganh"
        defaultValue={industry ?? ""}
        className="h-7 rounded-md border border-input bg-background px-2 text-[13px]"
      >
        <option value="">Tất cả ngành</option>
        {industries.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline">
        Lọc
      </Button>
    </form>
  );
}

async function Board({ source, industry }: { source: Exchange | BoardGroup; industry?: string }) {
  let items;
  try {
    const [rows, industryMap] = await Promise.all([getBoard(source), industry ? getIndustryMap() : null]);
    items = industryMap ? byIndustry(rows, industryMap, industry) : rows;
  } catch {
    return <PanelError title={boardTitle(source, industry)} />;
  }

  const sorted = [...items].sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <Panel
      title={boardTitle(source, industry)}
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
