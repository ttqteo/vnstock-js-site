import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { goToStock } from "@/app/actions";
import { ColumnHandle } from "@/components/column-resize";
import { PanelSkeleton, RailSkeleton } from "@/components/panel";
import { Input } from "@/components/ui/input";
import { NewsRail } from "@/components/news-rail";
import { RailTabs } from "@/components/rail-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocalSettings } from "@/components/widget-grid";
import { WatchlistRail } from "@/components/watchlist-rail";
import { WhatsNew } from "@/components/whats-new";
import { IndexList } from "@/widgets/index-list";
import "./globals.css";

export const metadata: Metadata = {
  title: "vnstock-js starter",
  description: "Dashboard chứng khoán Việt Nam, tự mở rộng bằng prompt.",
};

/** Full-bleed app shell: the document never scrolls, the three columns
 * scroll independently. Page nav lives in per-page <WorkspaceTabs>. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* Applies stored theme, column widths and widget order before
            first paint, so F5 shows the customized layout immediately. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var ls=localStorage,de=document.documentElement;
if(ls.getItem("vnstock-starter:theme")==="light")de.classList.add("light");
var c=JSON.parse(ls.getItem("vnstock-starter:columns")||"{}");
if(typeof c.left==="number")de.style.setProperty("--rail-l",Math.min(420,Math.max(200,c.left))+"px");
if(typeof c.right==="number")de.style.setProperty("--rail-r",Math.min(440,Math.max(220,c.right))+"px");
var o=JSON.parse(ls.getItem("vnstock-starter:widget-order")||"[]"),css="";
if(Array.isArray(o))for(var i=0;i<o.length;i++)if(/^[a-z0-9-]+$/.test(o[i]))css+='[data-slot="'+o[i]+'"]{order:'+i+'}';
if(css){var s=document.createElement("style");s.textContent=css;document.head.appendChild(s)}
}catch(e){}`,
          }}
        />
      </head>
      <body className="flex h-screen flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-1.5">
          <Link href="/" className="flex items-center gap-2 text-[14px] font-bold tracking-tight">
            <Image src="/vnstock.png" alt="" width={20} height={20} className="rounded-full" />
            vnstock-js starter
          </Link>
          <div className="flex items-center gap-1">
            <form action={goToStock} className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Tìm mã..." className="h-7 w-36 pl-7" autoComplete="off" />
            </form>
            <LocalSettings />
            <ThemeToggle />
            <WhatsNew />
            <a
              href="https://github.com/ttqteo/vnstock-js-starter"
              target="_blank"
              rel="noreferrer"
              title="GitHub"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {/* lucide dropped brand icons, so the GitHub mark is inlined. */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1 0 1.52-.01 2.75-.01 3.12 0 .3.2.66.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
              <span className="sr-only">GitHub</span>
            </a>
          </div>
        </header>
        {/* Column widths are CSS variables so the drag handles can resize
            them without touching the server-rendered structure. */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-border xl:grid-cols-[var(--rail-l,250px)_minmax(0,1fr)_var(--rail-r,270px)]">
          <aside className="relative hidden min-h-0 bg-card xl:block">
            <div className="h-full overflow-y-auto">
              <Suspense fallback={<PanelSkeleton title="Chỉ số" />}>
                <IndexList />
              </Suspense>
            </div>
            <ColumnHandle side="left" />
          </aside>
          <main className="min-w-0 overflow-y-auto bg-card">{children}</main>
          <aside className="relative hidden min-h-0 bg-card xl:block">
            <RailTabs tabs={["Watchlist", "Tin tức"]}>
              <Suspense fallback={<RailSkeleton />}>
                <WatchlistRail />
              </Suspense>
              <Suspense fallback={<RailSkeleton />}>
                <NewsRail />
              </Suspense>
            </RailTabs>
            <ColumnHandle side="right" />
          </aside>
        </div>
      </body>
    </html>
  );
}
