import { Suspense } from "react";
import { BoardTable } from "@/components/board-table";
import { Panel, PanelError, PanelSkeleton } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { WidgetGrid, WidgetSlot } from "@/components/widget-grid";
import { getBoard, type Exchange } from "@/lib/board";
import type { WorkspaceTab } from "@/lib/workspace";
import { Breadth } from "@/widgets/breadth";
import { ForeignFlow } from "@/widgets/foreign-flow";
import { Heatmap } from "@/widgets/heatmap";
import { IndexChart } from "@/widgets/index-chart";
import { MoneyFlow } from "@/widgets/money-flow";

const EXCHANGES = ["HOSE", "HNX", "UPCOM"] as const;

/**
 * One workspace pane. The server renders it twice over an app's lifetime at
 * most: with the page for the tab the cookie remembers, or from the loadPane
 * action the first time someone opens another tab. A pane nobody opens costs
 * no upstream call. New pane = a key in WORKSPACE_TABS plus a branch here.
 */
export function Pane({ tab, exchange }: { tab: WorkspaceTab; exchange: Exchange }) {
  if (tab === "bieu-do") return <ChartPane />;
  if (tab === "bang-gia") return <BoardPane exchange={exchange} />;
  return <MarketPane exchange={exchange} />;
}

function ExchangeTabs({ exchange }: { exchange: Exchange }) {
  return (
    <div className="flex items-center bg-card px-2 py-1.5">
      <Tabs
        items={EXCHANGES.map((e) => ({
          label: e === "HOSE" ? "HSX" : e,
          href: `/?ex=${e}`,
          active: e === exchange,
        }))}
      />
    </div>
  );
}

/* Adding a widget = one WidgetSlot here; Suspense per cell so each streams
   and fails on its own. */
function MarketPane({ exchange }: { exchange: Exchange }) {
  return (
    <>
      <ExchangeTabs exchange={exchange} />
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

function ChartPane() {
  return (
    <Suspense fallback={<PanelSkeleton title="VNINDEX" className="flex-1" />}>
      <IndexChart fill />
    </Suspense>
  );
}

function BoardPane({ exchange }: { exchange: Exchange }) {
  return (
    <>
      <ExchangeTabs exchange={exchange} />
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
