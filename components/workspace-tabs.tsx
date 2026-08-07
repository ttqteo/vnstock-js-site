"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { CandlestickChart, LayoutDashboard, Star, Table2 } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TAB_COOKIE, TAB_MAX_AGE, type WorkspaceTab } from "@/lib/workspace";

type Icon = ComponentType<{ className?: string }>;

/** `fill`: the pane sizes itself to the viewport instead of growing with its
 * content. The chart needs it, otherwise its canvas collapses to no height. */
const TABS: { key: WorkspaceTab; label: string; Icon: Icon; fill?: boolean }[] = [
  { key: "thi-truong", label: "Thị trường", Icon: LayoutDashboard },
  { key: "bieu-do", label: "Biểu đồ", Icon: CandlestickChart, fill: true },
  { key: "bang-gia", label: "Bảng giá", Icon: Table2 },
];

const EXTRA_ICONS: Record<string, Icon> = { chart: CandlestickChart, star: Star };

/**
 * Workspace tabs. Panes are server-rendered but not all at once: the page
 * sends the tab the cookie remembers, any other tab is fetched by the
 * loadPane action the first time it is opened and then kept mounted, so
 * switching back is instant and never re-hits the source.
 */
export function WorkspaceTabs({
  active: rendered,
  pane,
  exchange,
  loadPane,
}: {
  active: WorkspaceTab;
  pane: ReactNode;
  exchange: string;
  loadPane: (tab: WorkspaceTab, exchange: string) => Promise<ReactNode>;
}) {
  const [active, setActive] = useState(rendered);
  const [panes, setPanes] = useState<Partial<Record<WorkspaceTab, ReactNode>>>({ [rendered]: pane });
  const [failed, setFailed] = useState<WorkspaceTab | null>(null);

  // A fresh server render (exchange change, back button) makes every cached
  // pane stale, so the cache restarts from what the server just sent.
  useEffect(() => {
    setActive(rendered);
    setPanes({ [rendered]: pane });
    setFailed(null);
    remember(rendered);
  }, [rendered, pane]);

  const load = async (tab: WorkspaceTab) => {
    setFailed(null);
    try {
      const node = await loadPane(tab, exchange);
      setPanes((prev) => ({ ...prev, [tab]: node }));
    } catch {
      setFailed(tab);
    }
  };

  const pick = (tab: WorkspaceTab) => {
    setActive(tab);
    remember(tab);
    if (!panes[tab]) void load(tab);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-px bg-border",
        TABS.find((t) => t.key === active)?.fill ? "h-full" : "min-h-full"
      )}
    >
      <TabBar>
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} type="button" onClick={() => pick(key)} className={tabClass(key === active)}>
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </TabBar>
      {TABS.map(({ key }) =>
        panes[key] ? (
          <div
            key={key}
            className={key === active ? "flex min-h-0 flex-1 flex-col gap-px bg-border" : "hidden"}
          >
            {panes[key]}
          </div>
        ) : null
      )}
      {!panes[active] && (
        <PaneFallback
          label={TABS.find((t) => t.key === active)?.label ?? ""}
          failed={failed === active}
          onRetry={() => void load(active)}
        />
      )}
    </div>
  );
}

/** Same bar for pages that are their own route (a stock detail): the tabs
 * navigate home and ask for that pane. */
export function WorkspaceTabLinks({
  extra,
  extraIcon = "chart",
}: {
  extra?: string;
  extraIcon?: keyof typeof EXTRA_ICONS;
}) {
  const ExtraIcon = EXTRA_ICONS[extraIcon];
  return (
    <TabBar>
      {TABS.map(({ key, label, Icon }) => (
        <Link key={key} href={`/?tab=${key}`} className={tabClass(false)}>
          <Icon className="size-3.5" />
          {label}
        </Link>
      ))}
      {extra && (
        <span className={tabClass(true)}>
          <ExtraIcon className="size-3.5" />
          {extra}
        </span>
      )}
    </TabBar>
  );
}

function TabBar({ children }: { children: ReactNode }) {
  return <div className="flex items-end gap-0.5 bg-background px-1.5 pt-1.5">{children}</div>;
}

function tabClass(active: boolean) {
  return cn(
    "flex items-center gap-1.5 rounded-t-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
  );
}

function PaneFallback({
  label,
  failed,
  onRetry,
}: {
  label: string;
  failed: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-card py-16">
      {failed ? (
        <>
          <p className="text-[13px] text-muted-foreground">Không tải được {label}.</p>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        </>
      ) : (
        <>
          <Spinner className="size-6" />
          <p className="text-[13px] text-muted-foreground">Đang tải {label}...</p>
        </>
      )}
    </div>
  );
}

function remember(tab: WorkspaceTab) {
  document.cookie = `${TAB_COOKIE}=${tab}; path=/; max-age=${TAB_MAX_AGE}; samesite=lax`;
}
