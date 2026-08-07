import { getBoard, getIndustryMap, type Exchange } from "@/lib/board";
import { priceState, type PriceState } from "@/lib/colors";

export interface HeatTile {
  symbol: string;
  value: number;
  changePercent: number;
  state: PriceState;
}

export interface IndustryGroup {
  industry: string;
  valueTy: number;
  tiles: HeatTile[];
}

const GROUPS = 8;
const TILES_PER_GROUP = 12;

/** Joins board rows (60s cache) with industry classification (24h cache):
 * top industries by turnover, top symbols inside each. */
export async function getHeatmap(exchange: Exchange): Promise<IndustryGroup[]> {
  const [board, industryOf] = await Promise.all([getBoard(exchange), getIndustryMap()]);

  const groups = new Map<string, HeatTile[]>();
  for (const item of board) {
    if (item.price <= 0 || item.totalValue <= 0) continue;
    const industry = industryOf[item.symbol];
    if (!industry) continue;
    const tiles = groups.get(industry) ?? [];
    tiles.push({
      symbol: item.symbol,
      value: item.totalValue,
      changePercent:
        item.referencePrice > 0 ? ((item.price - item.referencePrice) / item.referencePrice) * 100 : 0,
      state: priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice),
    });
    groups.set(industry, tiles);
  }

  return [...groups.entries()]
    .map(([industry, tiles]) => ({
      industry,
      valueTy: tiles.reduce((sum, t) => sum + t.value, 0) / 1000,
      tiles: tiles.sort((a, b) => b.value - a.value).slice(0, TILES_PER_GROUP),
    }))
    .sort((a, b) => b.valueTy - a.valueTy)
    .slice(0, GROUPS);
}
