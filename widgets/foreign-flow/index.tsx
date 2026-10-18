import Link from "next/link";
import { Panel, PanelError } from "@/components/panel";
import { changeState, textClass } from "@/lib/colors";
import { fmtTy } from "@/lib/format";
import type { Exchange } from "@/lib/board";
import { getForeignFlow, type ForeignRow } from "./data";

/** Net foreign value plus the top net-bought and net-sold symbols. */
export async function ForeignFlow({ exchange, className = "" }: { exchange: Exchange; className?: string }) {
  let data;
  try {
    data = await getForeignFlow(exchange);
  } catch {
    return <PanelError title="Khối ngoại" className={className} />;
  }

  return (
    <Panel title={`Khối ngoại ${exchange}`} className={className} right={<span className="text-[12px] text-muted-foreground">{data.date}</span>}>
      <p className={`num text-lg font-bold ${textClass(changeState(data.netValueTy))}`}>
        {data.netValueTy > 0 ? "+" : ""}
        {fmtTy(data.netValueTy)}
      </p>
      <p className="num mb-2 text-[12px] text-muted-foreground">
        Mua {fmtTy(data.buyValueTy)} · Bán {fmtTy(data.sellValueTy)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <TopList title="Mua ròng" rows={data.topNetBuy} cls="text-up" />
        <TopList title="Bán ròng" rows={data.topNetSell} cls="text-down" />
      </div>
    </Panel>
  );
}

function TopList({ title, rows, cls }: { title: string; rows: ForeignRow[]; cls: string }) {
  return (
    <div>
      <p className="mb-1 text-[12px] text-muted-foreground uppercase">{title}</p>
      <ul className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <li key={row.symbol} className="flex justify-between text-[13px]">
            <Link href={`/ma/${row.symbol}`} className="font-semibold text-primary hover:underline">{row.symbol}</Link>
            <span className={`num ${cls}`}>{fmtTy(Math.abs(row.netValueTy))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
