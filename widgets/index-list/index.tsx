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
