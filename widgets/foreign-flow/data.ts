import { getOverview, type Exchange } from "@/lib/board";

export interface ForeignRow {
  symbol: string;
  netValueTy: number;
}

export interface ForeignFlowData {
  date: string;
  netValueTy: number;
  buyValueTy: number;
  sellValueTy: number;
  topNetBuy: ForeignRow[];
  topNetSell: ForeignRow[];
}

/** Foreign buy/sell for the session. market.* values are already tỷ VND. */
export async function getForeignFlow(exchange: Exchange): Promise<ForeignFlowData> {
  const ov = await getOverview(exchange);
  const f = ov.foreign;
  return {
    date: f.date,
    netValueTy: f.netValue,
    buyValueTy: f.buyValue,
    sellValueTy: f.sellValue,
    topNetBuy: f.topNetBuy.slice(0, 5).map((r) => ({ symbol: r.symbol, netValueTy: r.netValue })),
    topNetSell: f.topNetSell.slice(0, 5).map((r) => ({ symbol: r.symbol, netValueTy: r.netValue })),
  };
}
