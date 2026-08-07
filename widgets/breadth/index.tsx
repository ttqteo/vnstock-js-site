import { Panel, PanelError } from "@/components/panel";
import { COLORS } from "@/lib/colors";
import type { Exchange } from "@/lib/board";
import { getBreadth } from "./data";

/**
 * Advancing / declining / unchanged as a donut. Pure SVG on the server:
 * three circle segments over a pathLength=100 circumference.
 */
export async function Breadth({ exchange, className = "" }: { exchange: Exchange; className?: string }) {
  let data;
  try {
    data = await getBreadth(exchange);
  } catch {
    return <PanelError title="Độ rộng" className={className} />;
  }

  const sum = data.advancing + data.declining + data.unchanged || 1;
  const segments = [
    { value: (data.advancing / sum) * 100, color: COLORS.up, label: "Tăng", count: data.advancing },
    { value: (data.declining / sum) * 100, color: COLORS.down, label: "Giảm", count: data.declining },
    { value: (data.unchanged / sum) * 100, color: COLORS.ref, label: "Không đổi", count: data.unchanged },
  ];

  let offset = 25; // start at 12 o'clock
  return (
    <Panel title={`Độ rộng ${exchange}`} className={className} right={<span className="text-[12px] text-muted-foreground">{data.date}</span>}>
      <div className="flex items-center justify-center gap-5 py-1.5">
        <svg width="120" height="120" viewBox="0 0 42 42" aria-hidden>
          {segments.map((s) => {
            const el = (
              <circle
                key={s.label}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={s.color}
                strokeWidth="6"
                pathLength={100}
                strokeDasharray={`${s.value} ${100 - s.value}`}
                strokeDashoffset={offset}
              />
            );
            offset -= s.value;
            return el;
          })}
        </svg>
        <div className="flex flex-col gap-1.5">
          {segments.map((s) => (
            <p key={s.label} className="flex items-center gap-2 text-[13px]">
              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="num font-semibold">{s.count}</span>
            </p>
          ))}
          <p className="mt-1 text-[12px] text-muted-foreground">
            Trần <span className="num text-ceil">{data.ceiling}</span> · Sàn{" "}
            <span className="num text-floor">{data.floor}</span> / {data.total} mã
          </p>
        </div>
      </div>
    </Panel>
  );
}
