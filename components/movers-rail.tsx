import Link from "next/link";
import { getBoard } from "@/lib/board";
import { priceState, textClass } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";
import { changePct, topMovers } from "@/lib/movers";

/** HOSE gainers or losers for the right rail, from the cached full board. */
export async function MoversRail({ direction }: { direction: "up" | "down" }) {
  let items;
  try {
    items = topMovers(await getBoard("HOSE"), direction, 20);
  } catch {
    return <p className="p-4 text-center text-[13px] text-muted-foreground">Không tải được dữ liệu. Thử lại sau ít phút.</p>;
  }
  if (items.length === 0) {
    return <p className="p-6 text-center text-[13px] text-muted-foreground">Chưa có mã nào {direction === "up" ? "tăng" : "giảm"}.</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.symbol} className="border-b border-border last:border-b-0">
          <Link
            href={`/ma/${item.symbol}`}
            className="flex items-baseline justify-between gap-2 px-3 py-2 transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-primary">{item.symbol}</span>
              <span className="block truncate text-[12px] text-muted-foreground">{item.companyName}</span>
            </span>
            <span className="num text-right">
              <span className="block text-[14px] font-semibold">{fmtPrice(item.price)}</span>
              <span className={`block text-[12px] ${textClass(priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice))}`}>
                {fmtPct(changePct(item))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
