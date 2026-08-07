import type { ReactNode } from "react";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

/** Widget frame. Panels are flat on purpose: the surface pattern (gap-px
 * bg-border container, bg-card cells) draws the hairlines, not the panel. */
export function Panel({
  title,
  right,
  children,
  className = "",
  pad = true,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={cn("flex h-full flex-col overflow-hidden bg-card", className)}>
      <header className="flex min-h-9 items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {right}
      </header>
      <div className={cn("min-h-0 flex-1", pad && "p-3")}>{children}</div>
    </section>
  );
}

/** Suspense fallback with the same chrome, so the grid doesn't jump. The
 * spinner sits outside the pulsing block so it does not fade with it. */
export function PanelSkeleton({ title, className = "" }: { title: string; className?: string }) {
  return (
    <Panel title={title} className={className}>
      <div className="relative h-full min-h-16">
        <div className="h-full animate-pulse rounded-md bg-muted" />
        <Spinner className="absolute inset-0 m-auto" />
      </div>
    </Panel>
  );
}

/** Loading block for rail panes (RailTabs provides the chrome). */
export function RailSkeleton() {
  return (
    <div className="relative m-3 h-40">
      <div className="h-full animate-pulse rounded-md bg-muted" />
      <Spinner className="absolute inset-0 m-auto" />
    </div>
  );
}

/** One broken upstream call blanks one cell, never the page. */
export function PanelError({ title, className = "" }: { title: string; className?: string }) {
  return (
    <Panel title={title} className={className}>
      <p className="py-4 text-center text-muted-foreground">Không tải được dữ liệu. Thử lại sau ít phút.</p>
    </Panel>
  );
}
