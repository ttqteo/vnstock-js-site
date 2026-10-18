"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "vnstock-starter:rail-collapsed";

/** Hides the right rail for wide pages (chart, board); remembered per browser. */
export function RailToggle() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setCollapsed(document.documentElement.classList.contains("rail-collapsed")), []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.classList.toggle("rail-collapsed", next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
  };

  const Icon = collapsed ? PanelRightOpen : PanelRightClose;
  const label = collapsed ? "Hiện cột phải" : "Ẩn cột phải";
  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      data-testid="rail-toggle"
      className="hidden size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground xl:inline-flex"
    >
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
}
