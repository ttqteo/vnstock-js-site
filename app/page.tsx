import { MarketPane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";

// Rendered per request; every data call underneath is cached in lib/board.ts.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <MarketPane exchange={normalizeExchange(sp.ex)} />
    </div>
  );
}
