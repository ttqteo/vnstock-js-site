import { Panel, PanelError } from "@/components/panel";
import Link from "next/link";
import type { Exchange } from "@/lib/board";
import type { PriceState } from "@/lib/colors";
import { getHeatmap, type HeatTile } from "./data";
import { squarify } from "./treemap";

/** FireAnt-style industry heatmap: tile area = turnover, color = move. */
export async function Heatmap({ exchange, className = "" }: { exchange: Exchange; className?: string }) {
  let groups;
  try {
    groups = await getHeatmap(exchange);
  } catch {
    return <PanelError title="Bản đồ ngành" className={className} />;
  }

  return (
    <Panel title={`Bản đồ ngành ${exchange}`} className={className}>
      <div className="grid h-full auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {groups.map((group) => (
          <figure key={group.industry} className="flex min-h-32 flex-col">
            <figcaption className="mb-1 truncate text-[12px] text-muted-foreground">{group.industry}</figcaption>
            <div className="relative min-h-24 flex-1 overflow-hidden rounded-[1px]">
              {squarify(group.tiles.map((t) => ({ key: t.symbol, value: t.value }))).map((rect) => {
                const tile = group.tiles.find((t) => t.symbol === rect.key)!;
                return <Tile key={rect.key} tile={tile} x={rect.x} y={rect.y} w={rect.w} h={rect.h} />;
              })}
            </div>
          </figure>
        ))}
      </div>
    </Panel>
  );
}

function Tile({ tile, x, y, w, h }: { tile: HeatTile; x: number; y: number; w: number; h: number }) {
  const big = w > 22 && h > 18;
  return (
    <Link
      href={`/stock/${tile.symbol}`}
      title={`${tile.symbol} ${tile.changePercent.toFixed(2)}%`}
      className="absolute flex flex-col items-center justify-center overflow-hidden border border-bg/60 text-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        backgroundColor: shade(tile.state, tile.changePercent),
      }}
    >
      <span className="text-[12px] leading-tight font-bold">{tile.symbol}</span>
      {big && <span className="num text-[11px] leading-tight">{tile.changePercent.toFixed(2)}%</span>}
    </Link>
  );
}

/** Solid fills bucketed by move size, bảng điện colors at the extremes. */
function shade(state: PriceState, pct: number): string {
  if (state === "ceil") return "#a21caf";
  if (state === "floor") return "#0e7490";
  if (state === "ref" || pct === 0) return "#a16207";
  if (pct > 0) return pct >= 3 ? "#15803d" : "#16a34a";
  return pct <= -3 ? "#b91c1c" : "#dc2626";
}
