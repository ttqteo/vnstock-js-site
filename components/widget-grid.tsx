"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Everything the app remembers about the user is browser-local: this
 * localStorage prefix plus the watchlist cookie, both carried by
 * LocalSettings export/import. */
const PREFIX = "vnstock-starter:";
const STORAGE_KEY = `${PREFIX}widget-order`;
const COOKIE_PREFIX = "vnstock-starter-";

/** Drag-to-reorder for whole widgets. Widgets stay server components; this
 * wrapper only moves grid cells via CSS order. HTML5 DnD, desktop only. */

interface GridState {
  order: string[] | null;
  overId: string | null;
  start: (id: string) => void;
  over: (id: string) => void;
  drop: (id: string) => void;
  end: () => void;
}

const GridContext = createContext<GridState | null>(null);

export function WidgetGrid({ className = "", children }: { className?: string; children: ReactNode }) {
  // Registration stays one visible line in page.tsx: the default order is
  // read off the WidgetSlot ids in DOM order, no separate list to maintain.
  const defaultOrder = useMemo(
    () =>
      Children.toArray(children)
        .map((c) => (isValidElement(c) ? (c.props as { id?: unknown }).id : null))
        .filter((v): v is string => typeof v === "string"),
    [children]
  );

  const [saved, setSaved] = useState<string[] | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragRef = useRef<string | null>(null);

  // SSR renders default order; the saved order applies after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch {
      // Corrupt storage falls back to default order.
    }
  }, []);

  // Saved ids first (dropping ones that no longer exist), then any new
  // widgets in their DOM position, so adding a widget never hides it.
  const order = useMemo(() => {
    if (!saved) return null;
    const known = saved.filter((id) => defaultOrder.indexOf(id) !== -1);
    const missing = defaultOrder.filter((id) => known.indexOf(id) === -1);
    return known.concat(missing);
  }, [saved, defaultOrder]);

  const state: GridState = {
    order,
    overId,
    start: (id) => {
      dragRef.current = id;
    },
    over: (id) => setOverId(id),
    drop: (targetId) => {
      const sourceId = dragRef.current;
      dragRef.current = null;
      setOverId(null);
      if (!sourceId || sourceId === targetId) return;
      const base = order ?? defaultOrder;
      const next = base.filter((id) => id !== sourceId);
      next.splice(next.indexOf(targetId), 0, sourceId);
      setSaved(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    },
    end: () => {
      dragRef.current = null;
      setOverId(null);
    },
  };

  return (
    <GridContext.Provider value={state}>
      <div className={className}>{children}</div>
    </GridContext.Provider>
  );
}

/** Export/import all browser-local settings as one JSON file. */
export function LocalSettings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);

  const exportJson = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) data[key] = localStorage.getItem(key) ?? "";
    }
    for (const entry of document.cookie.split(";")) {
      const [name, ...rest] = entry.trim().split("=");
      if (name.startsWith(COOKIE_PREFIX)) data[`cookie:${name}`] = decodeURIComponent(rest.join("="));
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vnstock-starter-cai-dat.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      if (data === null || typeof data !== "object") throw new Error("not an object");
      for (const [key, value] of Object.entries(data)) {
        // Only keys in our namespace, and cookie values kept free of ";" and
        // "=": importing a random JSON file must not let it write arbitrary
        // localStorage keys or cookie attributes.
        if (key.startsWith(`cookie:${COOKIE_PREFIX}`) && typeof value === "string" && /^[A-Za-z0-9,-]*$/.test(value)) {
          document.cookie = `${key.slice(7)}=${value}; path=/; max-age=31536000; samesite=lax`;
        } else if (key.startsWith(PREFIX) && typeof value === "string") {
          localStorage.setItem(key, value);
        }
      }
      location.reload();
    } catch {
      setError(true);
    }
  };

  const buttonCls =
    "rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <div className="flex items-center gap-0.5">
      {error && <span className="mr-1 text-[12px] text-down">File không hợp lệ</span>}
      <button
        type="button"
        onClick={exportJson}
        title="Cài đặt (bố cục widget...) lưu trên trình duyệt này, xuất ra file để mang đi"
        className={buttonCls}
      >
        Xuất JSON
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title="Khôi phục cài đặt từ file đã xuất"
        className={buttonCls}
      >
        Nhập JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importJson(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function WidgetSlot({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const grid = useContext(GridContext);
  if (!grid) return <div className={`grid ${className}`}>{children}</div>;

  const idx = grid.order ? grid.order.indexOf(id) : -1;

  return (
    <div
      data-slot={id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        grid.start(id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        grid.over(id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        grid.drop(id);
      }}
      onDragEnd={grid.end}
      style={idx >= 0 ? { order: idx } : undefined}
      className={`grid cursor-grab active:cursor-grabbing ${
        grid.overId === id ? "rounded-sm outline-1 outline-primary outline-dashed" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
