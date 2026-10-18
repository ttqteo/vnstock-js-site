"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng menu" : "Mở menu"}
        aria-expanded={open}
        data-testid="mobile-menu-button"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>
      {open && (
        <div data-testid="mobile-menu" className="absolute inset-x-0 top-full z-30 border-b border-border bg-background p-2 shadow-lg">
          <NavLinks className="flex flex-col gap-0.5" onNavigate={() => setOpen(false)} />
          <div className="mt-1 flex items-center gap-2 border-t border-border px-2.5 pt-1 text-[13px] text-muted-foreground">
            Giao diện <ThemeToggle />
          </div>
        </div>
      )}
    </div>
  );
}
