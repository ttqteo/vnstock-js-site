import { ChartPane } from "@/components/panes";
import { INDEX_SYMBOLS } from "@/widgets/index-chart/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biểu đồ · vnstock-js" };

export default async function ChartPage({ searchParams }: { searchParams: Promise<{ ma?: string }> }) {
  const sp = await searchParams;
  const raw = (sp.ma ?? "VNINDEX").trim();
  const symbol = /^[A-Za-z0-9]{2,15}$/.test(raw) ? normalizeSymbol(raw) : "VNINDEX";
  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-px bg-border">
      <ChartPane symbol={symbol} />
    </div>
  );
}

/** Index codes keep their mixed case (HNXIndex); stock codes are upper case. */
function normalizeSymbol(raw: string): string {
  const hit = INDEX_SYMBOLS.find((i) => i.toLowerCase() === raw.toLowerCase());
  return hit ?? raw.toUpperCase();
}
