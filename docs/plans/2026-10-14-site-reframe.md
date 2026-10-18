# vnstock-js-site: đổi khung điều hướng

**Spec:** `docs/plans/2026-10-14-site-redesign-design.md` (mục "Khung điều hướng" và bước 1 của "Thứ tự")
**Setup:** `npm ci`
**Check:** `npm run typecheck`
**Verify:** `npm test && npm run build`
**Final:** `npx playwright install chromium && npm run build && node scripts/final-check.mjs`

Chuyển site từ một trang nhiều tab sang thanh điều hướng trên cùng với mỗi mục một route, thêm dải chỉ số, rail phải bốn tab, trang Tin tức, trang Nguồn dữ liệu và máy tính rủi ro. Mỗi mục là một route App Router render phía server, đọc dữ liệu qua `lib/board.ts` như cũ. Bỏ cơ chế tab giữ trong bộ nhớ (`WorkspaceTabs`, `loadPane`, cookie tab). Logic thuần nằm trong `lib/` và có test Vitest. Chạy trên vnstock-js 1.x đang dùng.

Ghi chú chung cho mọi task:
- Đọc `CLAUDE.md` của repo trước. Quy ước ở đó vẫn áp dụng, trừ những điểm Task 12 sửa lại (client island, điều hướng).
- UI tiếng Việt, code và comment tiếng Anh, comment tiết chế, không separator comment. Commit message tiếng Anh, không em-dash, không dòng Co-Authored-By.
- Đơn vị: giá cổ phiếu nghìn VND (`fmtPrice`), chỉ số là điểm, `PriceBoardItem.totalValue` là triệu VND. vnstock-js 1.5.1 chưa có `changePercent` trong bảng giá, tự tính từ `price` và `referencePrice`.
- Giữ nguyên prefix localStorage `vnstock-starter:` và cookie `vnstock-starter-`.
- Dải chỉ số nằm trên một hàng mỏng ngay dưới thanh điều hướng ở mọi kích thước màn hình (render một lần).
- Cơ hội và Phân tích chưa có trang, chưa hiện trên thanh điều hướng; không làm trang "Sắp có".
- Mỗi task phải để `npm run typecheck` xanh khi xong; vì vậy thứ gì còn được dùng thì chỉ xóa ở task gỡ chỗ dùng cuối cùng.

### Task 1: Vitest và Playwright
**Depends on:** none
**Files:** `package.json`, `package-lock.json`, `vitest.config.ts`

Run `npm install -D vitest@3.2.4 playwright@1.47.2`.

Trong `package.json`, `scripts` thêm:

```json
"test": "vitest run --passWithNoTests",
"typecheck": "tsc --noEmit"
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["lib/**/__tests__/**/*.test.ts"], environment: "node" },
});
```

Nếu `tsc --noEmit` báo lỗi type trong `vitest.config.ts` hoặc thư mục `scripts/`, thêm chúng vào `exclude` của `tsconfig.json` chỉ khi cần (và khi đó liệt kê `tsconfig.json` trong commit).

Chấp nhận: `npm test` thoát 0, `npm run typecheck` thoát 0.

### Task 2: Danh sách mục điều hướng
**Depends on:** Task 1
**Files:** `lib/nav.ts`, `lib/__tests__/nav.test.ts`

Viết test trước, chạy thấy fail, rồi mới viết module.

`lib/__tests__/nav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { activeNav, NAV } from "../nav";

describe("activeNav", () => {
  it("matches the home route only exactly", () => {
    expect(activeNav("/")).toBe("/");
    expect(activeNav("/bang-gia")).toBe("/bang-gia");
  });

  it("matches nested paths to their section", () => {
    expect(activeNav("/tin-tuc")).toBe("/tin-tuc");
    expect(activeNav("/danh-muc/abc")).toBe("/danh-muc");
  });

  it("returns null for pages outside the nav, like a stock page", () => {
    expect(activeNav("/ma/FPT")).toBeNull();
    expect(activeNav("/nguon-du-lieu")).toBeNull();
  });

  it("lists the sections in display order", () => {
    expect(NAV.map((n) => n.label)).toEqual(["Thị trường", "Bảng giá", "Biểu đồ", "Danh mục", "Tin tức"]);
  });
});
```

`lib/nav.ts`:

```ts
export interface NavItem {
  href: string;
  label: string;
}

/** Top-level sections. Cơ hội and Phân tích join when their pages exist. */
export const NAV: NavItem[] = [
  { href: "/", label: "Thị trường" },
  { href: "/bang-gia", label: "Bảng giá" },
  { href: "/bieu-do", label: "Biểu đồ" },
  { href: "/danh-muc", label: "Danh mục" },
  { href: "/tin-tuc", label: "Tin tức" },
];

/** href of the section the path belongs to, null when it belongs to none. */
export function activeNav(pathname: string): string | null {
  if (pathname === "/") return "/";
  for (const item of NAV) {
    if (item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/"))) return item.href;
  }
  return null;
}
```

Chấp nhận: `npx vitest run lib/__tests__/nav.test.ts` 4 passed.

### Task 3: Thanh điều hướng và menu điện thoại
**Depends on:** Task 2
**Files:** `components/nav-links.tsx`, `components/mobile-menu.tsx`

Hai client island mới; `nav-links.tsx` cần `usePathname` để tô sáng mục đang mở. Chưa gắn vào layout (Task 6 làm).

`components/nav-links.tsx`:

```tsx
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
```

`components/mobile-menu.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavLinks } from "@/components/nav-links";

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
        <div data-testid="mobile-menu" className="fixed inset-x-0 top-[41px] z-30 border-b border-border bg-background p-2 shadow-lg">
          <NavLinks className="flex flex-col gap-0.5" onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
```

`top-[41px]` là chiều cao header hiện tại; nếu ảnh chụp ở Final cho thấy lệch thì chỉnh.

Chấp nhận: `npm run typecheck` xanh. Hiển thị được kiểm ở Final, bước `nav-active` và `mobile-menu`.

### Task 4: Dải chỉ số
**Depends on:** none
**Files:** `widgets/index-list/index.tsx`

Giữ `widgets/index-list/data.ts`. Thêm export `IndexStrip` (nằm ngang, mỗi thẻ là link tới biểu đồ chỉ số đó) vào `widgets/index-list/index.tsx`. **Giữ nguyên** export `IndexList` hiện có, vì `app/layout.tsx` còn dùng; Task 6 xóa nó.

```tsx
/** Four main indices under the nav; each opens its chart. */
export async function IndexStrip() {
  let rows;
  try {
    rows = await getIndexList();
  } catch {
    return <div className="h-11 bg-card" />;
  }

  return (
    <div data-testid="index-strip" className="flex gap-px overflow-x-auto bg-border">
      {rows.map((row) => {
        const state = changeState(row.change);
        return (
          <Link
            key={row.symbol}
            href={`/bieu-do?ma=${row.symbol}`}
            className="flex min-w-[180px] flex-1 items-center justify-between gap-2 bg-card px-3 py-1.5 transition-colors hover:bg-muted/50"
          >
            <span>
              <span className="block text-[12px] font-bold">{row.label}</span>
              <span className={`num block text-[13px] font-semibold ${textClass(state)}`}>
                {fmtPrice(row.close)} <span className="font-normal">{fmtPct(row.changePercent)}</span>
              </span>
            </span>
            <Sparkline points={row.spark} color={COLORS[state]} width={64} height={22} />
          </Link>
        );
      })}
    </div>
  );
}
```

Thêm `import Link from "next/link";` ở đầu file. Fallback khi lỗi là một hàng trống cùng chiều cao để layout không nhảy.

Chấp nhận: `npm run typecheck` xanh. Hiển thị kiểm ở Final, bước `index-strip`.

### Task 5: Mã tăng mạnh, giảm mạnh
**Depends on:** Task 1
**Files:** `lib/movers.ts`, `lib/__tests__/movers.test.ts`, `components/movers-rail.tsx`

Test trước:

```ts
import { describe, expect, it } from "vitest";
import { changePct, topMovers } from "../movers";

const row = (symbol: string, price: number, referencePrice: number, totalVolume = 1000) =>
  ({ symbol, price, referencePrice, totalVolume }) as any;

describe("movers", () => {
  it("computes percent change against the reference price", () => {
    expect(changePct(row("A", 11, 10))).toBeCloseTo(10);
  });

  it("treats a symbol with no match yet as unchanged", () => {
    expect(changePct(row("A", 0, 10))).toBe(0);
  });

  it("returns the biggest gainers first", () => {
    const rows = [row("A", 10.5, 10), row("B", 11, 10), row("C", 9, 10)];
    expect(topMovers(rows, "up", 2).map((r) => r.symbol)).toEqual(["B", "A"]);
  });

  it("returns the biggest losers first and skips untraded rows", () => {
    const rows = [row("A", 9.5, 10), row("B", 9, 10), row("C", 9.8, 10, 0)];
    expect(topMovers(rows, "down", 5).map((r) => r.symbol)).toEqual(["B", "A"]);
  });
});
```

`lib/movers.ts` (`import type` bị xóa khi biên dịch, nên test không kéo `server-only` vào):

```ts
import type { PriceBoardItem } from "@/lib/board";

type Row = Pick<PriceBoardItem, "symbol" | "price" | "referencePrice" | "totalVolume">;

/** Percent change vs reference; 0 before the first match so it never reads as -100%. */
export function changePct(item: Row): number {
  if (item.price <= 0 || item.referencePrice <= 0) return 0;
  return ((item.price - item.referencePrice) / item.referencePrice) * 100;
}

export function topMovers<T extends Row>(items: T[], direction: "up" | "down", limit: number): T[] {
  const sign = direction === "up" ? 1 : -1;
  return items
    .filter((i) => i.totalVolume > 0 && sign * changePct(i) > 0)
    .sort((a, b) => sign * (changePct(b) - changePct(a)))
    .slice(0, limit);
}
```

`components/movers-rail.tsx` (server component, dùng lại `getBoard` đã cache; link trỏ `/ma/` vì Task 7 dời trang mã sang đó):

```tsx
import Link from "next/link";
import { getBoard } from "@/lib/board";
import { priceState, textClass } from "@/lib/colors";
import { fmtPct, fmtPrice } from "@/lib/format";
import { changePct, topMovers } from "@/lib/movers";

/** HOSE gainers or losers for the right rail, from the cached full board. */
export async function MoversRail({ direction }: { direction: "up" | "down" }) {
  let items;
  try {
    items = topMovers(await getBoard("HOSE"), direction, 20);
  } catch {
    return <p className="p-4 text-center text-[13px] text-muted-foreground">Không tải được dữ liệu. Thử lại sau ít phút.</p>;
  }
  if (items.length === 0) {
    return <p className="p-6 text-center text-[13px] text-muted-foreground">Chưa có mã nào {direction === "up" ? "tăng" : "giảm"}.</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.symbol} className="border-b border-border last:border-b-0">
          <Link
            href={`/ma/${item.symbol}`}
            className="flex items-baseline justify-between gap-2 px-3 py-2 transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-primary">{item.symbol}</span>
              <span className="block truncate text-[12px] text-muted-foreground">{item.companyName}</span>
            </span>
            <span className="num text-right">
              <span className="block text-[14px] font-semibold">{fmtPrice(item.price)}</span>
              <span className={`block text-[12px] ${textClass(priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice))}`}>
                {fmtPct(changePct(item))}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

Chấp nhận: `npx vitest run lib/__tests__/movers.test.ts` 4 passed; typecheck xanh.

### Task 6: Layout mới
**Depends on:** Task 3, Task 4, Task 5
**Files:** `app/layout.tsx`, `app/globals.css`, `components/rail-tabs.tsx`, `components/column-resize.tsx`, `components/rail-toggle.tsx`, `components/site-footer.tsx`, `widgets/index-list/index.tsx`

1. **Header** (`app/layout.tsx`): bỏ import `IndexList`, thêm `IndexStrip`, `NavLinks`, `MobileMenu`, `RailToggle`, `SiteFooter`, `MoversRail`. Bọc logo và `<NavLinks className="hidden items-center gap-0.5 md:flex" />` trong `<div className="flex items-center gap-3">`. Trong cụm nút bên phải: `<RailToggle />` trước `<LocalSettings />`, `<MobileMenu />` ở cuối.
2. **Dải chỉ số** ngay sau `</header>`:

```tsx
<Suspense fallback={<div className="h-11 shrink-0 bg-card" />}>
  <div className="shrink-0 border-b border-border">
    <IndexStrip />
  </div>
</Suspense>
```

3. **Hai cột**: thay khối grid ba cột bằng:

```tsx
{/* Below xl the rail stacks under the content and the whole area scrolls;
    from xl each column scrolls on its own. */}
<div data-shell className="grid min-h-0 flex-1 grid-cols-1 gap-px overflow-y-auto bg-border xl:grid-cols-[minmax(0,1fr)_var(--rail-r,300px)] xl:overflow-hidden">
  <main className="flex min-w-0 flex-col bg-card xl:overflow-y-auto">
    <div className="flex-1">{children}</div>
    <SiteFooter />
  </main>
  <aside data-rail className="relative min-h-[60vh] bg-card xl:min-h-0">
    <RailTabs tabs={["Theo dõi", "Tăng mạnh", "Giảm mạnh", "Tin tức"]}>
      <Suspense fallback={<RailSkeleton />}>
        <WatchlistRail />
      </Suspense>
      <Suspense fallback={<RailSkeleton />}>
        <MoversRail direction="up" />
      </Suspense>
      <Suspense fallback={<RailSkeleton />}>
        <MoversRail direction="down" />
      </Suspense>
      <Suspense fallback={<RailSkeleton />}>
        <NewsRail />
      </Suspense>
    </RailTabs>
    <ColumnHandle side="right" />
  </aside>
</div>
```

4. **Script trước first paint** trong `<head>`: bỏ dòng đọc `c.left`/`--rail-l`; thêm sau dòng `--rail-r`:

```js
if(ls.getItem("vnstock-starter:rail-collapsed")==="1")de.classList.add("rail-collapsed");
```

`app/globals.css`, ngoài hai block theme:

```css
/* Rail hidden by the header toggle; class set before first paint. */
html.rail-collapsed [data-rail] { display: none; }
@media (min-width: 1280px) {
  html.rail-collapsed [data-shell] { grid-template-columns: minmax(0, 1fr); }
}
```

5. `components/rail-toggle.tsx`:

```tsx
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
```

6. `components/site-footer.tsx`:

```tsx
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
      Miễn phí toàn bộ, không có gói trả phí. Dữ liệu trễ tối thiểu 60 giây, không phải khuyến nghị đầu tư.{" "}
      <Link href="/nguon-du-lieu" className="text-primary hover:underline">
        Nguồn và phương pháp
      </Link>
    </footer>
  );
}
```

7. `components/rail-tabs.tsx`: đổi `KEY` thành `"vnstock-starter:rail-tab-v2"` (thứ tự tab đã đổi; giữ key cũ thì người đang chọn "Tin tức" ở index 1 mở nhầm "Tăng mạnh"). Div ngoài cùng đổi `h-full` thành `xl:h-full`. Thêm `data-testid="rail-tab"` lên mỗi nút tab.
8. `components/column-resize.tsx`: bỏ nhánh `left` (`DEFAULTS`, `LIMITS`, `VARS` chỉ còn `right`, `type Side = "right"`), mặc định `right: 300`; giới hạn 220 đến 440 như cũ.
9. `widgets/index-list/index.tsx`: xóa export `IndexList` (không còn ai dùng) và import `Panel`/`PanelError` nếu thừa.

Chấp nhận: typecheck và build xanh. Hiển thị kiểm ở Final, các bước `nav-active`, `index-strip`, `rail-tabs`, `rail-collapse`, `mobile-menu`, `light-theme`.

### Task 7: Trang mã chuyển sang `/ma/[symbol]`
**Depends on:** none
**Files:** `app/stock/[symbol]/page.tsx`, `app/ma/[symbol]/page.tsx`, `app/actions.ts`, `components/board-table.tsx`, `components/watchlist-rail.tsx`, `widgets/foreign-flow/index.tsx`, `widgets/heatmap/index.tsx`, `prompts/02-them-cot-rsi.md`, `prompts/03-widget-top-tang-giam.md`

1. `git mv "app/stock/[symbol]/page.tsx" "app/ma/[symbol]/page.tsx"`, xóa thư mục `app/stock` nếu rỗng.
2. Trong trang mới: bỏ import và dòng `<WorkspaceTabLinks extra={symbol} />`. Thêm:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const s = decodeURIComponent(symbol).toUpperCase();
  return { title: `${s} · Giá cổ phiếu · vnstock-js` };
}
```

3. Đổi mọi `/stock/` thành `/ma/` trong `app/actions.ts` (`redirect(\`/ma/${q}\`)`), `components/board-table.tsx`, `components/watchlist-rail.tsx`, `widgets/foreign-flow/index.tsx`, `widgets/heatmap/index.tsx`. Trong hai file prompt, đổi `app/stock/[symbol]/page.tsx` thành `app/ma/[symbol]/page.tsx` và `/stock/mã` thành `/ma/mã`.
4. Redirect `/stock/:symbol` thuộc Task 8 (`next.config.ts`), không làm ở đây.

Chấp nhận: `grep -rn "/stock/\|WorkspaceTabLinks" app components widgets prompts` không ra kết quả; typecheck xanh. Kiểm ở Final, bước `stock-page` và `search`.

### Task 8: Tách pane thành route
**Depends on:** Task 7
**Files:** `components/panes.tsx`, `app/page.tsx`, `app/bang-gia/page.tsx`, `app/bieu-do/page.tsx`, `widgets/index-chart/index.tsx`, `widgets/index-chart/data.ts`, `next.config.ts`, `app/panes.tsx`, `components/workspace-tabs.tsx`, `lib/workspace.ts`

1. `components/panes.tsx`: xóa hàm `Pane` và import `WorkspaceTab`. `ExchangeTabs` nhận thêm `basePath` và dựng `href: \`${basePath}?ex=${e}\``. Export `MarketPane` (gọi `ExchangeTabs` với `basePath="/"`), `BoardPane` (`basePath="/bang-gia"`), `ChartPane`. Comment đầu file: mỗi pane là nội dung của một route.
2. `ChartPane({ symbol })`: `<Suspense key={symbol} fallback={<PanelSkeleton title={symbol} className="flex-1" />}><SymbolChart symbol={symbol} /></Suspense>`, phía trên là form GET chọn mã:

```tsx
<form action="/bieu-do" className="flex items-center gap-1.5 bg-card px-2 py-1.5">
  <Input name="ma" defaultValue={symbol} placeholder="Mã hoặc chỉ số" className="h-7 w-40" autoComplete="off" />
  <Button type="submit" size="sm" variant="outline">Xem</Button>
</form>
```

`SymbolChart` là async server component cùng file: nếu `symbol` thuộc `VNINDEX`, `VN30`, `HNXIndex`, `HNXUpcomIndex` thì `<IndexChart fill symbol={symbol} />`; ngược lại lấy `getStockHistory(symbol, chartBarCount())` trong `try/catch` và render `PriceChart` như `StockChart` của trang mã, `fill` bật; lỗi hoặc lịch sử rỗng thì `<PanelError title={symbol} />`.
3. `widgets/index-chart/index.tsx` và `data.ts`: thêm prop/tham số `symbol` (mặc định `"VNINDEX"`), dùng thay chuỗi cứng `"VNINDEX"`; tiêu đề Panel là `symbol`.
4. `app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { MarketPane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";

export const dynamic = "force-dynamic";

const OLD_TABS: Record<string, string> = { "bang-gia": "/bang-gia", "bieu-do": "/bieu-do" };

export default async function Home({ searchParams }: { searchParams: Promise<{ ex?: string; tab?: string }> }) {
  const sp = await searchParams;
  // Links from the single-page era carried ?tab=.
  if (sp.tab && OLD_TABS[sp.tab]) redirect(OLD_TABS[sp.tab]);
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <MarketPane exchange={normalizeExchange(sp.ex)} />
    </div>
  );
}
```

5. `app/bang-gia/page.tsx`:

```tsx
import { BoardPane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng giá · vnstock-js" };

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ ex?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <BoardPane exchange={normalizeExchange(sp.ex)} />
    </div>
  );
}
```

6. `app/bieu-do/page.tsx`:

```tsx
import { ChartPane } from "@/components/panes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biểu đồ · vnstock-js" };

const INDICES = ["VNINDEX", "VN30", "HNXIndex", "HNXUpcomIndex"];

export default async function ChartPage({ searchParams }: { searchParams: Promise<{ ma?: string }> }) {
  const sp = await searchParams;
  const raw = (sp.ma ?? "VNINDEX").trim();
  const symbol = /^[A-Za-z0-9]{2,15}$/.test(raw) ? normalizeSymbol(raw) : "VNINDEX";
  return (
    <div className="flex h-full min-h-[70vh] flex-col gap-px bg-border">
      <ChartPane symbol={symbol} />
    </div>
  );
}

/** Index codes keep their mixed case (HNXIndex); stock codes are upper case. */
function normalizeSymbol(raw: string): string {
  const hit = INDICES.find((i) => i.toLowerCase() === raw.toLowerCase());
  return hit ?? raw.toUpperCase();
}
```

7. Xóa `app/panes.tsx`, `components/workspace-tabs.tsx`, `lib/workspace.ts` (`git rm`).
8. `next.config.ts`: thay khối `redirects` (redirect cũ `/bang-gia → /?tab=bang-gia` phải bỏ, nếu không route mới không bao giờ tới được) bằng:

```ts
async redirects() {
  return [{ source: "/stock/:symbol", destination: "/ma/:symbol", permanent: true }];
},
```

Chấp nhận: `grep -rn "?tab=\|WorkspaceTab\|loadPane\|lib/workspace" app components lib widgets` không ra gì ngoài `OLD_TABS` của `app/page.tsx`; typecheck và build xanh. Kiểm ở Final, các bước `nav-active`, `chart-symbol`, `exchange`, `redirects`.

### Task 9: Trang Tin tức
**Depends on:** Task 1
**Files:** `lib/news-filter.ts`, `lib/__tests__/news-filter.test.ts`, `components/news-rail.tsx`, `app/tin-tuc/page.tsx`

Chỉ hiện tiêu đề, nguồn, thời gian và link bài gốc, không chép nội dung (Nghị định 147/2024).

Test trước:

```ts
import { describe, expect, it } from "vitest";
import { filterBySource, sourcesOf } from "../news-filter";

const items = [
  { id: "1", source: "CafeF", title: "a" },
  { id: "2", source: "Vietstock", title: "b" },
  { id: "3", source: "CafeF", title: "c" },
] as any[];

describe("news filter", () => {
  it("lists sources by how often they appear", () => {
    expect(sourcesOf(items)).toEqual(["CafeF", "Vietstock"]);
  });

  it("keeps everything without a source filter", () => {
    expect(filterBySource(items, undefined)).toHaveLength(3);
  });

  it("filters by source, case-insensitive", () => {
    expect(filterBySource(items, "cafef").map((i) => i.id)).toEqual(["1", "3"]);
  });
});
```

`lib/news-filter.ts`:

```ts
type WithSource = { source: string };

export function sourcesOf<T extends WithSource>(items: T[]): string[] {
  const count = new Map<string, number>();
  for (const i of items) count.set(i.source, (count.get(i.source) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

export function filterBySource<T extends WithSource>(items: T[], source: string | undefined): T[] {
  if (!source) return items;
  const s = source.toLowerCase();
  return items.filter((i) => i.source.toLowerCase() === s);
}
```

`components/news-rail.tsx`: tách markup một dòng thành `export function NewsItem({ item, large }: { item: FinancialNews; large?: boolean })` (`large` cho tiêu đề `text-[14px]`), `NewsRail` dùng lại nó.

`app/tin-tuc/page.tsx`: server component, `dynamic = "force-dynamic"`, `metadata.title = "Tin tức · vnstock-js"`.
- `searchParams`: `ma`, `nguon`. `ma` hợp lệ (`/^[A-Za-z0-9]{3,10}$/`) thì `getNews(ma.toUpperCase())`, không thì `getTodayNews()`; `try/catch`, lỗi thì `PanelError`.
- Thanh lọc: form GET ô "Lọc theo mã" (`name="ma"`), và `Tabs` các nguồn từ `sourcesOf(items)`: "Tất cả" cộng tối đa 8 nguồn, href giữ `ma`.
- Danh sách `NewsItem large`, không giới hạn 15 dòng; rỗng thì "Không có tin phù hợp." Gắn `data-testid="news-list"` lên `<ul>`.

Chấp nhận: `npx vitest run lib/__tests__/news-filter.test.ts` 3 passed; build xanh. Kiểm ở Final, bước `news`.

### Task 10: Máy tính rủi ro và trang Danh mục
**Depends on:** Task 1
**Files:** `lib/risk.ts`, `lib/__tests__/risk.test.ts`, `components/risk-calculator.tsx`, `app/danh-muc/page.tsx`

Vốn (đồng), % vốn chấp nhận mất, giá vào và giá dừng lỗ (nghìn đồng như bảng giá). Ra số cổ phiếu làm tròn xuống lô 100, không vượt vốn, kèm mục tiêu 2R và 3R.

Test trước:

```ts
import { describe, expect, it } from "vitest";
import { positionSize } from "../risk";

describe("positionSize", () => {
  it("sizes so the stop loses the chosen share of capital, in lots of 100", () => {
    const r = positionSize({ capital: 100_000_000, riskPct: 1, entry: 50, stop: 48 });
    expect(r).toMatchObject({ ok: true, shares: 500, orderValue: 25_000_000, riskAmount: 1_000_000 });
    if (r.ok) {
      expect(r.target2R).toBe(54);
      expect(r.target3R).toBe(56);
    }
  });

  it("rounds down to a whole lot", () => {
    const r = positionSize({ capital: 100_000_000, riskPct: 1, entry: 50, stop: 47 });
    expect(r.ok && r.shares).toBe(300);
  });

  it("never spends more than the capital", () => {
    const r = positionSize({ capital: 10_000_000, riskPct: 5, entry: 50, stop: 49.9 });
    expect(r.ok && r.shares).toBe(200);
    expect(r.ok && r.orderValue).toBeLessThanOrEqual(10_000_000);
  });

  it("rejects a stop at or above entry", () => {
    expect(positionSize({ capital: 1e8, riskPct: 1, entry: 50, stop: 50 })).toEqual({
      ok: false,
      error: "Giá dừng lỗ phải thấp hơn giá vào.",
    });
  });

  it("rejects non-positive inputs", () => {
    expect(positionSize({ capital: 0, riskPct: 1, entry: 50, stop: 48 }).ok).toBe(false);
    expect(positionSize({ capital: 1e8, riskPct: 0, entry: 50, stop: 48 }).ok).toBe(false);
  });
});
```

`lib/risk.ts`:

```ts
export interface RiskInput {
  /** VND. */
  capital: number;
  /** Percent of capital accepted as loss if the stop hits, e.g. 1 for 1%. */
  riskPct: number;
  /** nghin VND, same unit as the price board. */
  entry: number;
  stop: number;
}

export type RiskResult =
  | {
      ok: true;
      shares: number;
      /** VND. */
      orderValue: number;
      riskAmount: number;
      capitalPct: number;
      target2R: number;
      target3R: number;
    }
  | { ok: false; error: string };

const LOT = 100;

export function positionSize({ capital, riskPct, entry, stop }: RiskInput): RiskResult {
  if (!(capital > 0) || !(riskPct > 0) || !(entry > 0) || !(stop > 0)) {
    return { ok: false, error: "Nhập vốn, % rủi ro, giá vào và giá dừng lỗ lớn hơn 0." };
  }
  if (stop >= entry) return { ok: false, error: "Giá dừng lỗ phải thấp hơn giá vào." };
  const perShareRisk = Math.round((entry - stop) * 1000);
  const byRisk = Math.floor((capital * riskPct) / 100 / perShareRisk / LOT) * LOT;
  const byCapital = Math.floor(capital / (entry * 1000) / LOT) * LOT;
  const shares = Math.min(byRisk, byCapital);
  if (shares <= 0) return { ok: false, error: "Vốn chưa đủ cho một lô 100 cổ phiếu với mức rủi ro này." };
  const r = entry - stop;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ok: true,
    shares,
    orderValue: shares * entry * 1000,
    riskAmount: shares * perShareRisk,
    capitalPct: round2(((shares * entry * 1000) / capital) * 100),
    target2R: round2(entry + 2 * r),
    target3R: round2(entry + 3 * r),
  };
}
```

`components/risk-calculator.tsx`: `"use client"`, 4 ô `Input` (class `num`) có `name` lần lượt `capital`, `riskPct`, `entry`, `stop`; mặc định vốn 100000000, rủi ro 1, giá vào và dừng lỗ trống. Gọi `positionSize` mỗi lần đổi:
- `ok: false` và đã nhập đủ thì hiện lỗi `text-down`;
- `ok: true` thì hiện Số cổ phiếu (`data-testid="risk-shares"`), Giá trị lệnh (`fmtInt` + " đ"), Chiếm % vốn, Tiền mất nếu chạm dừng lỗ, Mục tiêu 2R và 3R (`fmtPrice`).
Lưu 4 giá trị vào localStorage `vnstock-starter:risk-calc` trong `try/catch`. Chú thích nhỏ: "Lô 100 cổ phiếu. Chưa tính phí giao dịch và thuế."

`app/danh-muc/page.tsx` (`metadata.title = "Danh mục · vnstock-js"`): `grid gap-px bg-border md:grid-cols-2`, một `Panel` "Máy tính rủi ro" chứa `<RiskCalculator />`, một `Panel` "Danh mục" một câu: quản lý danh mục nhiều tài khoản và nhật ký giao dịch, lưu ngay trên trình duyệt, sẽ có ở bản sau.

Chấp nhận: `npx vitest run lib/__tests__/risk.test.ts` 5 passed; build xanh. Kiểm ở Final, bước `risk-calc`.

### Task 11: Trang Nguồn dữ liệu
**Depends on:** none
**Files:** `app/nguon-du-lieu/page.tsx`

Server component tĩnh, `metadata.title = "Nguồn dữ liệu và phương pháp · vnstock-js"`, nội dung trong `Panel`, chữ `text-[14px] leading-relaxed`, tiêu đề trang `<h1>Nguồn dữ liệu và phương pháp</h1>`:
- Dữ liệu giá và thị trường lấy từ VCI qua thư viện mã nguồn mở vnstock-js (link https://github.com/ttqteo/vnstock-js và https://vnstock-js-docs.vercel.app). Cập nhật trễ tối thiểu 60 giây.
- Tin tức: chỉ tiêu đề và link về bài gốc của từng nguồn.
- Watchlist, cài đặt và sau này danh mục lưu trên trình duyệt của bạn; site không có tài khoản và không gửi dữ liệu đó đi đâu. Dùng nút xuất/nhập ở header để sao lưu.
- Miễn phí toàn bộ, không có gói trả phí.
- Miễn trừ: thông tin chỉ để tham khảo, không phải khuyến nghị hay tư vấn đầu tư; dữ liệu có thể trễ hoặc sai.
- "Mục này sẽ liệt kê công thức của từng chỉ báo và tín hiệu khi các tính năng đó ra mắt."

Chấp nhận: build xanh. Kiểm ở Final, bước `data-source`.

### Task 12: CLAUDE.md, README, có gì mới
**Depends on:** Task 6, Task 8, Task 9, Task 10, Task 11
**Files:** `CLAUDE.md`, `README.md`, `components/whats-new.tsx`, `package.json`

1. `CLAUDE.md`:
   - Thay gạch đầu dòng "Tương tác là điều hướng… Đúng bảy client component được phép…" bằng: tương tác là điều hướng (searchParams, form GET); không state library; chỉ dùng client component khi tương tác không làm được bằng server và URL. Liệt kê island hiện có: `chart.tsx`, `widget-grid.tsx`, `column-resize.tsx`, `theme-toggle.tsx`, `rail-tabs.tsx`, `rail-toggle.tsx`, `nav-links.tsx`, `mobile-menu.tsx`, `risk-calculator.tsx`, `whats-new.tsx`, cộng `app/error.tsx`. Island mới phải ghi lý do.
   - Thay gạch đầu dòng "Cột giữa là MỘT trang (`/`) với các tab workspace…" bằng: mỗi mục là một route; danh sách mục ở `lib/nav.ts` (thêm mục = một dòng ở đó và `app/<slug>/page.tsx`); trang mã là `/ma/[symbol]`, `/stock/:symbol` redirect sang đó; pane của Thị trường, Bảng giá, Biểu đồ nằm trong `components/panes.tsx`.
   - Cookie: bỏ `-tab`. localStorage: thêm `rail-tab-v2`, `rail-collapsed`, `risk-calc`.
   - App shell: rail trái đã bỏ, dải chỉ số dưới thanh điều hướng, dưới `xl` rail xếp dưới nội dung và cả vùng cuộn chung.
   - Lệnh: thêm `npm test`, `npm run typecheck`.
2. `README.md`: đoạn giới thiệu liệt kê các mục (Thị trường, Bảng giá, Biểu đồ, Danh mục với máy tính rủi ro, Tin tức).
3. `components/whats-new.tsx`: thêm phần tử đầu mảng `CHANGELOG`, `version: "1.1.0"`, `date` là ngày làm, items:
   - "Thanh điều hướng mới: Thị trường, Bảng giá, Biểu đồ, Danh mục, Tin tức, mỗi mục một đường dẫn riêng"
   - "Dải chỉ số VNINDEX, VN30, HNX, UPCOM ngay dưới thanh điều hướng, bấm để xem biểu đồ"
   - "Cột phải thêm tab Tăng mạnh, Giảm mạnh; ẩn được cột phải khi cần chỗ rộng"
   - "Biểu đồ xem được mọi mã và chỉ số"
   - "Trang Tin tức lọc theo mã và nguồn"
   - "Máy tính rủi ro: tính số cổ phiếu theo vốn và mức dừng lỗ"
   - "Trang mã chuyển sang /ma/<mã>, link cũ vẫn chạy"
4. `package.json`: `"version": "1.1.0"`.

Chấp nhận: build xanh.

### Task 13: Kịch bản kiểm tra cuối
**Depends on:** Task 1
**Files:** `scripts/final-check.mjs`

Viết `scripts/final-check.mjs` (Node ESM, Playwright chromium). Đây là thứ duy nhất kiểm tra app đang chạy, lệnh Final của plan gọi nó sau `npm run build`.

Khung:
- Không import được `playwright` hoặc không mở được chromium: in lý do ở dòng cuối và `process.exit(3)`.
- Chạy `next start -p 3107` (`spawn("npx", ["next", "start", "-p", "3107"], { shell: true })`), chờ `fetch("http://localhost:3107/")` trả về (tối đa 90 giây); không lên được thì exit 1. Luôn kill server khi kết thúc (cả khi lỗi), trên Windows dùng `taskkill /pid <pid> /T /F`.
- `OUT = process.env.ARC_FINAL_OUT || "final-out"`; mỗi bước chụp ảnh `OUT/<step>.png`; cuối cùng ghi `OUT/shots.json` dạng `[{ name: "reframe", files: [...], steps: [{ step, state, detail? }] }]`.
- Mỗi bước bọc `try/catch`: lỗi thì state `fail` kèm `detail` là message, chạy tiếp bước sau. Có bước fail thì exit 1, không thì exit 0.
- Dữ liệu thị trường có thể trống ngoài giờ giao dịch: chỉ kiểm cấu trúc (phần tử, URL, thuộc tính), không kiểm số liệu.

Các bước (viewport 1366×900 trừ khi ghi khác):
1. `nav-active`: lần lượt `/`, `/bang-gia`, `/bieu-do`, `/danh-muc`, `/tin-tuc`; mỗi trang đúng một `nav[aria-label="Mục chính"] a[aria-current="page"]` và chữ của nó là nhãn tương ứng trong `NAV` (Thị trường, Bảng giá, Biểu đồ, Danh mục, Tin tức).
2. `stock-page`: `/ma/FPT` không có link nào mang `aria-current="page"`; `document.title` chứa "FPT".
3. `index-strip`: `[data-testid="index-strip"] a` có đúng 4 phần tử; bấm thẻ có chữ "VN30" thì URL thành `/bieu-do?ma=VN30` và có `canvas` cao hơn 100px.
4. `chart-symbol`: `/bieu-do?ma=FPT` có `canvas` cao hơn 100px; `/bieu-do?ma=XXXXZ` hiện chữ "Không tải được dữ liệu" và vẫn có thanh điều hướng.
5. `exchange`: `/bang-gia?ex=HNX` có chữ "Bảng giá HNX"; `/?ex=UPCOM` có tab "UPCOM" đang chọn.
6. `rail-tabs`: bấm tab "Tăng mạnh" (`[data-testid="rail-tab"]`), reload, tab đó vẫn đang chọn (nền `bg-primary`, hoặc so `localStorage["vnstock-starter:rail-tab-v2"] === "1"`).
7. `rail-collapse`: bấm `[data-testid="rail-toggle"]`, `[data-rail]` không còn hiển thị; reload, vẫn ẩn và `document.documentElement.classList.contains("rail-collapsed")`; bấm lại để mở.
8. `redirects`: `/stock/FPT` kết thúc ở `/ma/FPT`; `/?tab=bang-gia` kết thúc ở `/bang-gia`.
9. `search`: gõ "fpt" vào ô `input[name="q"]` ở header, Enter, URL thành `/ma/FPT`.
10. `news`: `/tin-tuc` có `[data-testid="news-list"]` hoặc chữ "Không có tin phù hợp."; `/tin-tuc?ma=FPT` cũng vậy.
11. `risk-calc`: `/danh-muc`, điền `capital` 100000000, `riskPct` 1, `entry` 50, `stop` 48; `[data-testid="risk-shares"]` chứa "500".
12. `data-source`: `/nguon-du-lieu` có `h1` "Nguồn dữ liệu và phương pháp"; footer có link tới trang này.
13. `mobile-menu` (viewport 390×844): `/`, thanh `nav` của header bị ẩn; bấm `[data-testid="mobile-menu-button"]` thì `[data-testid="mobile-menu"]` hiện; bấm "Bảng giá" thì URL thành `/bang-gia` và menu đóng; `[data-rail]` nằm dưới `main` (toạ độ `y` lớn hơn).
14. `light-theme`: đặt `localStorage["vnstock-starter:theme"] = "light"`, reload `/`, `html` có class `light`; chụp ảnh.

Chấp nhận: `node --check scripts/final-check.mjs` thoát 0; typecheck xanh. Script chạy thật ở Final.
