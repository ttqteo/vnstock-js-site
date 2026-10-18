import Link from "next/link";
import { Sparkline } from "@/components/sparkline";
import { changeState, COLORS, textClass } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";
import { getIndexList } from "./data";

/** Four main indices under the nav; each opens its chart. */
export async function IndexStrip() {
  let rows;
  try {
    rows = await getIndexList();
  } catch {
    return <div className="h-11 bg-card" />;
  }

  return (
    <div data-testid="index-strip" className="flex gap-px overflow-x-auto bg-border">
      {rows.map((row) => {
        const state = changeState(row.change);
        return (
          <Link
            key={row.symbol}
            href={`/bieu-do?ma=${row.symbol}`}
            className="flex min-w-[180px] flex-1 items-center justify-between gap-2 bg-card px-3 py-1.5 transition-colors hover:bg-muted/50"
          >
            <span>
              <span className="block text-[12px] font-bold">{row.label}</span>
              <span className={`num block text-[13px] font-semibold ${textClass(state)}`}>
                {fmtPrice(row.close)} <span className="font-normal">{fmtPct(row.changePercent)}</span>
              </span>
            </span>
            <Sparkline points={row.spark} color={COLORS[state]} width={64} height={22} />
          </Link>
        );
      })}
    </div>
  );
}
