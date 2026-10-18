"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNav, NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const current = activeNav(usePathname());
  return (
    <nav className={className} aria-label="Mục chính">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          aria-current={item.href === current ? "page" : undefined}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
            item.href === current ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
