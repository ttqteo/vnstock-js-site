import Link from "next/link";
import { Panel, PanelError } from "@/components/panel";
import { Sparkline } from "@/components/sparkline";
import { changeState, COLORS, textClass } from "@/lib/colors";
import { fmtChange, fmtPct, fmtPrice } from "@/lib/format";
import { getIndexList } from "./data";

/** Left rail: the four main indices with a 30-session sparkline. */
export async function IndexList() {
  let rows;
  try {
    rows = await getIndexList();
  } catch {
    return <PanelError title="Chỉ số" />;
  }

  return (
    <Panel title="Chỉ số" pad={false}>
      <ul>
        {rows.map((row) => {
          const state = changeState(row.change);
          return (
            <li key={row.symbol} className="flex items-center justify-between gap-2 border-b border-border px-2.5 py-2 last:border-b-0">
              <div className="min-w-0">
                <p className="text-[13px] font-bold">{row.label}</p>
                <p className={`num text-[14px] font-semibold ${textClass(state)}`}>{fmtPrice(row.close)}</p>
                <p className={`num text-[12px] ${textClass(state)}`}>
                  {fmtChange(row.change)} / {fmtPct(row.changePercent)}
                </p>
              </div>
              <Sparkline points={row.spark} color={COLORS[state]} />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

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
