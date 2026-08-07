import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string;
  active: boolean;
}

/** Segmented link tabs: a tab is a URL, the server renders the new state. */
export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <nav className="inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-[5px] px-2.5 py-1 text-[13px] font-medium transition-colors",
            item.active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
