import { Panel, PanelError } from "@/components/panel";
import { COLORS } from "@/lib/colors";
import { fmtTy } from "@/lib/format";
import type { Exchange } from "@/lib/board";
import { getMoneyFlow } from "./data";

/** Turnover split by direction, as three horizontal bars. */
export async function MoneyFlow({ exchange, className = "" }: { exchange: Exchange; className?: string }) {
  let data;
  try {
    data = await getMoneyFlow(exchange);
  } catch {
    return <PanelError title="Dòng tiền" className={className} />;
  }

  const rows = [
    { label: "Tăng", value: data.upTy, color: COLORS.up },
    { label: "Giảm", value: data.downTy, color: COLORS.down },
    { label: "Không đổi", value: data.unchangedTy, color: COLORS.ref },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Panel title={`Dòng tiền ${exchange}`} className={className} right={<span className="num text-[12px] text-muted-foreground">Tổng {fmtTy(data.totalTy)}</span>}>
      <div className="flex flex-col gap-2.5 py-1.5">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="mb-0.5 flex justify-between text-[12px]">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="num font-semibold" style={{ color: row.color }}>{fmtTy(row.value)}</span>
            </p>
            <div className="h-3 rounded-[1px] bg-muted">
              <div
                className="h-full rounded-[1px]"
                style={{ width: `${(row.value / max) * 100}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
