import Link from "next/link";
import { X } from "lucide-react";
import { addWatchlistSymbol, removeWatchlistSymbol } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWatchlistBoard } from "@/lib/board";
import { priceState, textClass } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";

/** Watchlist pane of the right rail. Rows link to the stock page; the add
 * form is pinned at the bottom. All mutations are cookie server actions. */
export async function WatchlistRail() {
  let items;
  try {
    items = await getWatchlistBoard();
  } catch {
    return <p className="p-4 text-center text-[13px] text-muted-foreground">Không tải được dữ liệu. Thử lại sau ít phút.</p>;
  }

  return (
    <div className="flex min-h-full flex-col">
      {items.length === 0 ? (
        <p className="p-4 text-center text-[13px] text-muted-foreground">Danh sách trống. Thêm mã ở ô bên dưới.</p>
      ) : (
        <ul>
          {items.map((item) => {
            const pct = item.referencePrice > 0 ? ((item.price - item.referencePrice) / item.referencePrice) * 100 : 0;
            const cls = textClass(priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice));
            return (
              <li key={item.symbol} className="group flex items-center border-b border-border last:border-b-0">
                <Link
                  href={`/ma/${item.symbol}`}
                  className="flex min-w-0 flex-1 items-baseline justify-between gap-2 px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-bold text-primary">{item.symbol}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">{item.companyName}</span>
                  </span>
                  <span className="num text-right">
                    <span className="block text-[14px] font-semibold">{fmtPrice(item.price)}</span>
                    <span className={`block text-[12px] ${cls}`}>{fmtPct(pct)}</span>
                  </span>
                </Link>
                <form action={removeWatchlistSymbol} className="pr-1.5">
                  <input type="hidden" name="symbol" value={item.symbol} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100"
                    title={`Bỏ ${item.symbol} khỏi watchlist`}
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Bỏ {item.symbol}</span>
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <form action={addWatchlistSymbol} className="mt-auto flex items-center gap-1.5 border-t border-border p-2">
        <Input name="symbol" placeholder="VD: VNM" autoComplete="off" className="h-7" />
        <Button type="submit" size="sm" className="shrink-0">
          Thêm mã
        </Button>
      </form>
    </div>
  );
}
