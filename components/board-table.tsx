import Link from "next/link";
import type { PriceBoardItem } from "@/lib/board";
import { priceState, textClass } from "@/lib/colors";
import { fmtPrice, fmtVolume } from "@/lib/format";

/** The classic bảng điện: price cells colored against reference/ceiling/floor. */
export function BoardTable({ items }: { items: PriceBoardItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="num w-full whitespace-nowrap text-right text-[13px]">
        <thead className="sticky top-0 z-10 bg-muted text-[12px] text-muted-foreground">
          <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-1.5 [&>th]:py-1">
            <th rowSpan={2} className="sticky left-0 z-20 bg-muted text-left">Mã</th>
            <th rowSpan={2}>Trần</th>
            <th rowSpan={2}>Sàn</th>
            <th rowSpan={2}>TC</th>
            <th colSpan={6} className="text-center">Bên mua</th>
            <th colSpan={3} className="text-center">Khớp lệnh</th>
            <th colSpan={6} className="text-center">Bên bán</th>
            <th rowSpan={2}>Cao</th>
            <th rowSpan={2}>Thấp</th>
            <th rowSpan={2}>Tổng KL</th>
            <th colSpan={2} className="text-center">NN</th>
          </tr>
          <tr className="[&>th]:border-b [&>th]:border-border [&>th]:px-1.5 [&>th]:py-1">
            <th>G3</th><th>KL3</th><th>G2</th><th>KL2</th><th>G1</th><th>KL1</th>
            <th>Giá</th><th>KL</th><th>+/-%</th>
            <th>G1</th><th>KL1</th><th>G2</th><th>KL2</th><th>G3</th><th>KL3</th>
            <th>Mua</th><th>Bán</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <BoardRow key={item.symbol} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BoardRow({ item }: { item: PriceBoardItem }) {
  const { referencePrice: ref, ceilingPrice: ceil, floorPrice: floor } = item;
  const cls = (price: number) => textClass(priceState(price, ref, ceil, floor));
  const matchCls = item.price > 0 ? cls(item.price) : "text-muted-foreground";
  const pct = ref > 0 && item.price > 0 ? ((item.price - ref) / ref) * 100 : null;

  const bids = levels(item.bidPrices);
  const asks = levels(item.askPrices);

  return (
    <tr className="border-b border-border/40 odd:bg-white/[0.015] hover:bg-muted [&>td]:px-1.5 [&>td]:py-0.5">
      <td className="sticky left-0 z-10 bg-card text-left">
        <Link href={`/ma/${item.symbol}`} className={`font-bold ${matchCls}`}>{item.symbol}</Link>
      </td>
      <td className="text-ceil">{fmtPrice(ceil)}</td>
      <td className="text-floor">{fmtPrice(floor)}</td>
      <td className="text-ref">{fmtPrice(ref)}</td>
      {[bids[2], bids[1], bids[0]].map((level, i) => (
        <Level key={`b${i}`} level={level} cls={cls} />
      ))}
      <td className={`font-semibold ${matchCls}`}>{item.price > 0 ? fmtPrice(item.price) : "–"}</td>
      <td className={matchCls}>{item.matchVolume > 0 ? fmtVolume(item.matchVolume) : "–"}</td>
      <td className={matchCls}>{pct == null ? "–" : `${pct > 0 ? "+" : ""}${pct.toFixed(1)}`}</td>
      {[asks[0], asks[1], asks[2]].map((level, i) => (
        <Level key={`a${i}`} level={level} cls={cls} />
      ))}
      <td className={item.highestPrice > 0 ? cls(item.highestPrice) : "text-muted-foreground"}>
        {item.highestPrice > 0 ? fmtPrice(item.highestPrice) : "–"}
      </td>
      <td className={item.lowestPrice > 0 ? cls(item.lowestPrice) : "text-muted-foreground"}>
        {item.lowestPrice > 0 ? fmtPrice(item.lowestPrice) : "–"}
      </td>
      <td>{item.totalVolume > 0 ? fmtVolume(item.totalVolume) : "–"}</td>
      <td className="text-muted-foreground">{item.foreignBuyVolume > 0 ? fmtVolume(item.foreignBuyVolume) : "–"}</td>
      <td className="text-muted-foreground">{item.foreignSellVolume > 0 ? fmtVolume(item.foreignSellVolume) : "–"}</td>
    </tr>
  );
}

function Level({
  level,
  cls,
}: {
  level: { price: number; volume: number } | undefined;
  cls: (price: number) => string;
}) {
  if (!level || level.price <= 0) {
    return (
      <>
        <td className="text-muted-foreground">–</td>
        <td className="text-muted-foreground">–</td>
      </>
    );
  }
  const c = cls(level.price);
  return (
    <>
      <td className={c}>{fmtPrice(level.price)}</td>
      <td className={c}>{fmtVolume(level.volume)}</td>
    </>
  );
}

function levels(arr: { price: number; volume: number }[] | undefined) {
  return [arr?.[0], arr?.[1], arr?.[2]];
}
