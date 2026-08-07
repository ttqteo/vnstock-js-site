"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "vnstock-starter:theme";

/** Light/dark switch. Dark is default; "light" on <html> flips the tokens
 * in globals.css. The inline head script prevents a first-paint flash. */
export function ThemeToggle() {
  const [light, setLight] = useState<boolean | null>(null);

  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);

  const toggle = () => {
    const next = !(light ?? false);
    document.documentElement.classList.toggle("light", next);
    setLight(next);
    try {
      localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Chuyển giao diện sáng/tối"
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {light ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Sáng/tối</span>
    </button>
  );
}
