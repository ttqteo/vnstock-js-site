"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "vnstock-starter:seen-version";

/** Newest first. Add an entry on top when releasing; the card pops itself
 * once for whoever has not seen that version yet. */
const CHANGELOG: { version: string; date: string; items: string[] }[] = [
  {
    version: "1.0.0",
    date: "2026-08-07",
    items: [
      "Bảng điện HOSE / HNX / UPCOM đầy đủ trần sàn, khớp lệnh, dư mua bán",
      "4 widget thị trường: độ rộng, dòng tiền, khối ngoại, bản đồ ngành, kéo thả sắp xếp được",
      "Biểu đồ nến 5 năm với MA10/MA50, pan và zoom",
      "Watchlist lưu trên trình duyệt của bạn, thêm xoá tại chỗ",
      "Tin tức tài chính trong ngày ở rail phải",
      "Giao diện sáng tối, kéo chỉnh độ rộng cột, xuất nhập cài đặt JSON",
      "Mở rộng bằng prompt với Claude Code: xem thư mục prompts/",
    ],
  },
];

const VERSION = CHANGELOG[0].version;

/** The card that opens itself fades out on its own; one opened from the
 * badge stays until dismissed. Hovering holds it open. */
const AUTO_HIDE_MS = 10_000;
/** Must match --animate-panel-out in globals.css. */
const EXIT_MS = 160;

/** Version badge in the header plus the changelog card. The card shows only
 * the newest release when it opens itself, the full log when clicked. */
export function WhatsNew() {
  const [view, setView] = useState<"closed" | "latest" | "all">("closed");
  const [closing, setClosing] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== VERSION) setView("latest");
    } catch {}
  }, []);

  const dismiss = () => {
    setClosing(true);
    try {
      localStorage.setItem(KEY, VERSION);
    } catch {}
  };

  useEffect(() => {
    if (view !== "latest" || closing || held) return;
    const timer = setTimeout(dismiss, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [view, closing, held]);

  // Unmount only after the exit animation; opening again cancels it.
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      setView("closed");
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setClosing(false);
          setView("all");
        }}
        title="Changelog"
        className="num inline-flex h-7 items-center rounded-md px-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        v{VERSION}
      </button>
      {view !== "closed" && (
        <Card
          entries={view === "all" ? CHANGELOG : CHANGELOG.slice(0, 1)}
          closing={closing}
          onHold={setHeld}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}

function Card({
  entries,
  closing,
  onHold,
  onDismiss: dismiss,
}: {
  entries: typeof CHANGELOG;
  closing: boolean;
  onHold: (held: boolean) => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      onMouseEnter={() => onHold(true)}
      onMouseLeave={() => onHold(false)}
      className={`fixed right-3 bottom-3 z-40 flex max-h-[70vh] w-80 origin-bottom-right flex-col rounded-lg border border-border bg-card p-4 shadow-xl motion-reduce:animate-none ${
        closing ? "animate-panel-out" : "animate-panel-in"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-[14px] font-bold">Changelog</p>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Đóng</span>
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {entries.map((entry) => (
          <section key={entry.version}>
            <p className="mb-1 flex items-baseline gap-2">
              <span className="num text-[13px] font-bold text-primary">v{entry.version}</span>
              <span className="num text-[12px] text-muted-foreground">{entry.date}</span>
            </p>
            <ul className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-1.5">
                  <span className="text-up">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Button size="sm" onClick={dismiss} className="mt-3 w-full">
        Đã hiểu
      </Button>
    </aside>
  );
}
