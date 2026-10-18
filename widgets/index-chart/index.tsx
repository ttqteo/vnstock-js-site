import { PriceChart } from "@/components/chart";
import { Panel, PanelError } from "@/components/panel";
import { changeState, textClass } from "@/lib/colors";
import { fmtChange, fmtPct, fmtPrice } from "@/lib/format";
import { DEFAULT_RANGE, getIndexChart, RANGES } from "./data";

/**
 * Index candles (VNINDEX by default) with MA10/MA50 and volume. Range buttons
 * live inside the chart island and slice data client-side, so switching is instant.
 */
export async function IndexChart({
  symbol = "VNINDEX",
  height = 320,
  fill = false,
}: {
  symbol?: string;
  height?: number;
  fill?: boolean;
}) {
  let data;
  try {
    data = await getIndexChart(symbol);
  } catch {
    data = null;
  }
  if (!data) return <PanelError title={symbol} className="h-[380px]" />;

  const state = changeState(data.change);

  return (
    <Panel
      title={symbol}
      className={fill ? "flex-1" : ""}
      right={
        <p className={`num text-[13px] font-semibold ${textClass(state)}`}>
          {fmtPrice(data.close)}{" "}
          <span className="font-normal">
            {fmtChange(data.change)} / {fmtPct(data.changePercent)}
          </span>
          <span className="ml-2 font-normal text-muted-foreground">{data.date}</span>
        </p>
      }
      pad={false}
    >
      <PriceChart
        candles={data.candles}
        volumes={data.volumes}
        lines={data.lines}
        ranges={RANGES}
        initialRange={DEFAULT_RANGE}
        height={height}
        fill={fill}
      />
    </Panel>
  );
}
