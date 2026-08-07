"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const KEY = "vnstock-starter:rail-tab";

/** Right-rail tabs. Panes are server-rendered children; this only toggles
 * visibility and remembers the last tab. */
export function RailTabs({
  tabs,
  right,
  children,
}: {
  tabs: string[];
  right?: ReactNode;
  children: ReactNode[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    try {
      const i = Number(localStorage.getItem(KEY));
      if (Number.isInteger(i) && i >= 0 && i < tabs.length) setActive(i);
    } catch {}
  }, [tabs.length]);

  const pick = (i: number) => {
    setActive(i);
    try {
      localStorage.setItem(KEY, String(i));
    } catch {}
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-end gap-0.5 border-b border-border bg-muted/40 px-1.5 pt-1.5">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => pick(i)}
            className={cn(
              "rounded-t-[4px] px-3 py-1.5 text-[13px] font-medium transition-colors",
              i === active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
        {right && <span className="mb-1.5 ml-auto">{right}</span>}
      </div>
      {children.map((child, i) => (
        <div key={i} className={i === active ? "min-h-0 flex-1 overflow-y-auto" : "hidden"}>
          {child}
        </div>
      ))}
    </div>
  );
}
