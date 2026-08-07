import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import vnstock, { market, news } from "./vnstock";
import { getWatchlist } from "./watchlist";
import type { VnstockTypes, MarketTypes } from "vnstock-js";

export type PriceBoardItem = VnstockTypes.PriceBoardItem;
export type QuoteHistory = VnstockTypes.QuoteHistory;
export type FinancialNews = VnstockTypes.FinancialNews;
export type Exchange = MarketTypes.Exchange;
export type MarketOverview = MarketTypes.MarketOverview;

/**
 * Every network call lives here, wrapped in unstable_cache: 1000 views in
 * a minute is still 1 upstream call per source. Need a new source? Add a
 * cached function here; never call vnstock-js from a widget or page.
 */

const REVALIDATE = 60;

/** Full price board for one exchange; one call serves every row-based widget. */
export const getBoard = cache(
  unstable_cache(
    async (exchange: Exchange): Promise<PriceBoardItem[]> => {
      const listed = await vnstock.stock.listing.symbolsByGroup(exchange);
      const symbols = listed.map((s) => s.symbol);
      if (symbols.length === 0) return [];
      return vnstock.stock.trading.priceBoard(symbols);
    },
    ["price-board"],
    { revalidate: REVALIDATE }
  )
);

/** Index level, breadth, liquidity and foreign flow in one upstream fetch. */
export const getOverview = cache(
  unstable_cache(
    (exchange: Exchange): Promise<MarketOverview> => market.overview({ exchange }),
    ["market-overview"],
    { revalidate: REVALIDATE }
  )
);

/** Daily bars for an index (VNINDEX, VN30, HNXIndex, HNXUpcomIndex).
 * Values are points, not thousands of VND. */
export const getIndexHistory = cache(
  unstable_cache(
    (symbol: string, countBack: number): Promise<QuoteHistory[]> =>
      market.index(symbol, { countBack }),
    ["index-history"],
    { revalidate: REVALIDATE }
  )
);

/** Daily bars for a stock, prices in nghin VND. */
export const getStockHistory = cache(
  unstable_cache(
    (symbol: string, countBack: number): Promise<QuoteHistory[]> =>
      vnstock.stock.quote.history({
        symbols: [symbol],
        start: backdate(countBack),
        timeFrame: "1D",
        countBack,
      }),
    ["stock-history"],
    { revalidate: REVALIDATE }
  )
);

/** One price-board row for one symbol, null when the symbol is unknown. */
export const getSymbolBoard = cache(
  unstable_cache(
    async (symbol: string): Promise<PriceBoardItem | null> => {
      const items = await vnstock.stock.trading.priceBoard([symbol]);
      return items.length > 0 && items[0].symbol ? items[0] : null;
    },
    ["symbol-board"],
    { revalidate: REVALIDATE }
  )
);

/** Board rows for an explicit symbol list, cached per list. */
export const getBoardForSymbols = cache(
  unstable_cache(
    (symbols: string[]): Promise<PriceBoardItem[]> => {
      if (symbols.length === 0) return Promise.resolve([]);
      return vnstock.stock.trading.priceBoard(symbols);
    },
    ["board-for-symbols"],
    { revalidate: REVALIDATE }
  )
);

/** Viewer's watchlist rows. Cookie read must stay outside unstable_cache;
 * only the price fetch is cached. */
export const getWatchlistBoard = cache(async (): Promise<PriceBoardItem[]> => {
  const symbols = await getWatchlist();
  return getBoardForSymbols(symbols);
});

/** symbol -> industry name. Classification barely changes, cache for a day. */
export const getIndustryMap = cache(
  unstable_cache(
    async (): Promise<Record<string, string>> => {
      const rows = await vnstock.stock.listing.symbolsByIndustries();
      const map: Record<string, string> = {};
      for (const r of rows) map[r.symbol] = r.industry;
      return map;
    },
    ["industry-map"],
    { revalidate: 86400 }
  )
);

/** Today's news mentioning a keyword (a symbol works). */
export const getNews = cache(
  unstable_cache(
    (keyword: string): Promise<FinancialNews[]> => news.search(keyword),
    ["news-search"],
    { revalidate: 300 }
  )
);

/** Today's feed; falls back one day when today's file is still empty. */
export const getTodayNews = cache(
  unstable_cache(
    async (): Promise<FinancialNews[]> => {
      const today = await news.byDate();
      if (today.length > 0) return today;
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return news.byDate(d.toISOString().substring(0, 10));
    },
    ["news-today"],
    { revalidate: 300 }
  )
);

export function normalizeExchange(value: string | undefined): Exchange {
  return value === "HNX" || value === "UPCOM" ? value : "HOSE";
}

function backdate(countBack: number): string {
  const d = new Date();
  // Calendar days padded for weekends and holidays, same rule the SDK uses.
  d.setDate(d.getDate() - Math.ceil(countBack * 1.6) - 10);
  return d.toISOString().substring(0, 10);
}
