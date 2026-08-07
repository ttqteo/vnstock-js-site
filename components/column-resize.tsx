"use client";

import { useEffect, useRef } from "react";

/** Resizable rails: each handle drags a CSS variable the layout grid
 * reads, so the server-rendered structure never changes. */

const KEY = "vnstock-starter:columns";
const DEFAULTS = { left: 250, right: 270 } as const;
const LIMITS = { left: [200, 420], right: [220, 440] } as const;
const VARS = { left: "--rail-l", right: "--rail-r" } as const;

type Side = keyof typeof DEFAULTS;

function readStored(): Partial<Record<Side, number>> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return parsed !== null && typeof parsed === "object" ? (parsed as Partial<Record<Side, number>>) : {};
  } catch {
    return {};
  }
}

function clamp(side: Side, width: number): number {
  const [min, max] = LIMITS[side];
  return Math.min(max, Math.max(min, width));
}

function setVar(side: Side, width: number): void {
  document.documentElement.style.setProperty(VARS[side], `${width}px`);
}

export function ColumnHandle({ side }: { side: Side }) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    const stored = readStored()[side];
    if (typeof stored === "number" && Number.isFinite(stored)) setVar(side, clamp(side, stored));
  }, [side]);

  const currentWidth = () => {
    const raw = document.documentElement.style.getPropertyValue(VARS[side]);
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : DEFAULTS[side];
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Kéo chỉnh độ rộng cột"
      onPointerDown={(e) => {
        e.preventDefault();
        startX.current = e.clientX;
        startWidth.current = currentWidth();
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const move = (ev: PointerEvent) => {
          const dx = ev.clientX - startX.current;
          setVar(side, clamp(side, side === "left" ? startWidth.current + dx : startWidth.current - dx));
        };
        const up = () => {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          document.body.style.userSelect = "";
          document.body.style.cursor = "";
          try {
            localStorage.setItem(KEY, JSON.stringify({ ...readStored(), [side]: currentWidth() }));
          } catch {}
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      }}
      className={`absolute inset-y-0 z-10 hidden w-1 cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary/60 xl:block ${
        side === "left" ? "-right-0.5" : "-left-0.5"
      }`}
    />
  );
}
