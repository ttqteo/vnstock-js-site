import { cookies } from "next/headers";
import { loadPane } from "@/app/panes";
import { Pane } from "@/components/panes";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { normalizeExchange } from "@/lib/board";
import { normalizeTab, TAB_COOKIE } from "@/lib/workspace";

// Rendered per request; every data call underneath is cached in lib/board.ts.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const ex = normalizeExchange(sp.ex);
  // ?tab= is for links from other routes; otherwise the cookie decides, so
  // the server renders the pane the viewer left open with no flash.
  const jar = await cookies();
  const tab = normalizeTab(sp.tab ?? jar.get(TAB_COOKIE)?.value);

  return (
    <WorkspaceTabs
      active={tab}
      exchange={ex}
      loadPane={loadPane}
      pane={<Pane tab={tab} exchange={ex} />}
    />
  );
}
