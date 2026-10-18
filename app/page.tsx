import { redirect } from "next/navigation";
import { MarketPane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";

// Rendered per request; every data call underneath is cached in lib/board.ts.
export const dynamic = "force-dynamic";

const OLD_TABS: Record<string, string> = { "bang-gia": "/bang-gia", "bieu-do": "/bieu-do" };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  // Links from the single-page era carried ?tab=.
  if (sp.tab && OLD_TABS[sp.tab]) redirect(OLD_TABS[sp.tab]);
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <MarketPane exchange={normalizeExchange(sp.ex)} />
    </div>
  );
}
