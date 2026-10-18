import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { addWatchlistSymbol, removeWatchlistSymbol } from "@/app/actions";
import { PriceChart } from "@/components/chart";
import { Panel, PanelError, PanelSkeleton } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { getWatchlist } from "@/lib/watchlist";
import { getNews, getStockHistory, getSymbolBoard } from "@/lib/board";
import { priceState, textClass } from "@/lib/colors";
import { fmtChange, fmtPct, fmtPrice, fmtTy, fmtVolume, trieuToTy } from "@/lib/format";
import { chartBarCount, DEFAULT_RANGE, RANGES } from "@/widgets/index-chart/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const s = decodeURIComponent(symbol).toUpperCase();
  return { title: `${s} · Giá cổ phiếu · vnstock-js` };
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = decodeURIComponent(raw).toUpperCase();

  let item;
  try {
    item = await getSymbolBoard(symbol);
  } catch {
    item = null;
  }
  if (!item) notFound();

  const cls = textClass(priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice));
  const pct = item.referencePrice > 0 ? ((item.price - item.referencePrice) / item.referencePrice) * 100 : null;
  const change = item.price > 0 ? item.price - item.referencePrice : null;

  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-card px-3 py-2">
        <h1 className="text-lg font-bold">{symbol}</h1>
        <p className="truncate text-[13px] text-muted-foreground">{item.companyName}</p>
        <p className={`num text-[16px] font-bold ${cls}`}>
          {item.price > 0 ? fmtPrice(item.price) : "–"}
          <span className="ml-2 text-[13px] font-semibold">
            {fmtChange(change)} / {fmtPct(pct)}
          </span>
        </p>
        <WatchButton symbol={symbol} />
      </div>

      <Suspense fallback={<PanelSkeleton title="Biểu đồ" className="h-[380px]" />}>
        <StockChart symbol={symbol} />
      </Suspense>

      <div className="grid flex-1 gap-px bg-border md:grid-cols-2">
        <Snapshot item={item} />
        <Suspense fallback={<PanelSkeleton title="Tin tức" />}>
          <NewsPanel symbol={symbol} />
        </Suspense>
      </div>
    </div>
  );
}

async function WatchButton({ symbol }: { symbol: string }) {
  const list = await getWatchlist();
  const inList = list.indexOf(symbol) !== -1;
  return (
    <form action={inList ? removeWatchlistSymbol : addWatchlistSymbol} className="ml-auto">
      <input type="hidden" name="symbol" value={symbol} />
      <Button type="submit" variant="outline" size="sm">
        <Star className={`size-3.5 ${inList ? "fill-ref text-ref" : ""}`} />
        {inList ? "Bỏ theo dõi" : "Thêm vào watchlist"}
      </Button>
    </form>
  );
}

async function StockChart({ symbol }: { symbol: string }) {
  let bars;
  try {
    bars = await getStockHistory(symbol, chartBarCount());
  } catch {
    return <PanelError title="Biểu đồ" />;
  }
  if (bars.length === 0) return <PanelError title="Biểu đồ" />;

  return (
    <Panel title={`${symbol} · nến ngày`} pad={false}>
      <PriceChart
        candles={bars.map((b) => ({ time: b.date, open: b.open, high: b.high, low: b.low, close: b.close }))}
        volumes={bars.map((b) => ({ time: b.date, value: b.volume, up: b.close >= b.open }))}
        ranges={RANGES}
        initialRange={DEFAULT_RANGE}
        height={320}
      />
    </Panel>
  );
}

function Snapshot({ item }: { item: NonNullable<Awaited<ReturnType<typeof getSymbolBoard>>> }) {
  const rows: { label: string; value: string; cls?: string }[] = [
    { label: "Tham chiếu", value: fmtPrice(item.referencePrice), cls: "text-ref" },
    { label: "Trần", value: fmtPrice(item.ceilingPrice), cls: "text-ceil" },
    { label: "Sàn", value: fmtPrice(item.floorPrice), cls: "text-floor" },
    { label: "Cao nhất", value: item.highestPrice > 0 ? fmtPrice(item.highestPrice) : "–" },
    { label: "Thấp nhất", value: item.lowestPrice > 0 ? fmtPrice(item.lowestPrice) : "–" },
    { label: "Giá TB", value: item.averagePrice > 0 ? fmtPrice(item.averagePrice) : "–" },
    { label: "Tổng KL", value: fmtVolume(item.totalVolume) },
    { label: "Giá trị", value: fmtTy(trieuToTy(item.totalValue)) },
    { label: "NN mua", value: fmtVolume(item.foreignBuyVolume) },
    { label: "NN bán", value: fmtVolume(item.foreignSellVolume) },
    { label: "Dư mua G1", value: level(item.bidPrices?.[0]) },
    { label: "Dư bán G1", value: level(item.askPrices?.[0]) },
  ];

  return (
    <Panel title="Phiên hôm nay">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2 border-b border-border/60 pb-1">
            <dt className="text-[12px] text-muted-foreground">{row.label}</dt>
            <dd className={`num text-[13px] font-semibold ${row.cls ?? ""}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

function level(l: { price: number; volume: number } | undefined): string {
  if (!l || l.price <= 0) return "–";
  return `${fmtPrice(l.price)} × ${fmtVolume(l.volume)}`;
}

async function NewsPanel({ symbol }: { symbol: string }) {
  let items;
  try {
    items = await getNews(symbol);
  } catch {
    return <PanelError title="Tin tức" />;
  }

  return (
    <Panel title="Tin tức trong ngày" pad={false}>
      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">Chưa có tin nhắc tới {symbol} hôm nay.</p>
      ) : (
        <ul>
          {items.slice(0, 8).map((n) => (
            <li key={n.id} className="border-b border-border/60 px-2.5 py-1.5 last:border-b-0">
              <a href={n.link} target="_blank" rel="noreferrer" className="block text-[13px] leading-snug hover:underline">
                {n.title}
              </a>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {n.source} · {n.publishedAt}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
