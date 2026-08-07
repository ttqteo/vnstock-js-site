"use server";

import { Pane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";
import { normalizeTab } from "@/lib/workspace";

/** Renders one pane on demand and streams it back as JSX. This is what makes
 * the workspace tabs cheap: opening a tab fetches only that tab, and the
 * client keeps what it already loaded, so switching back costs nothing. */
export async function loadPane(tab: string, exchange: string) {
  return <Pane tab={normalizeTab(tab)} exchange={normalizeExchange(exchange)} />;
}
