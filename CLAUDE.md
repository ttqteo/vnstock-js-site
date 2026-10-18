# vnstock-js-site

Dashboard chứng khoán Việt Nam miễn phí kiểu bảng điện: Next.js App Router + vnstock-js, chạy công khai tại vnstock-js.vercel.app. Ai cũng có thể fork và mở rộng bằng prompt, nên giữ code cùng hình dạng với code có sẵn quan trọng hơn mọi sự thông minh.

Repo từng tên `vnstock-js-starter`. Prefix localStorage `vnstock-starter:` và cookie `vnstock-starter-` cố ý giữ nguyên: đổi sẽ xóa watchlist và cài đặt của người đang dùng.

## Quy ước bắt buộc

- Một widget là một folder trong `widgets/` gồm đúng 2 file: `data.ts` (lấy và biến đổi dữ liệu, không import React) và `index.tsx` (render, không gọi mạng). Khuôn ở `widgets/_template/`.
- Mọi lời gọi mạng nằm trong `lib/board.ts`, bọc `unstable_cache` với revalidate tối thiểu 60 giây. Widget và trang không import `vnstock-js` trực tiếp; cần nguồn mới thì thêm hàm cached vào `lib/board.ts` trước. Đây là thứ giữ cho VCI không rate-limit khi trang có nhiều người xem.
- Widget là async server component, tự `try/catch` quanh lời gọi data và trả `<PanelError>` khi lỗi. Một widget hỏng chỉ được trắng một ô, không được trắng cả trang.
- Widget mới bọc trong `<Panel>` và đăng ký thủ công trong `MarketPane` ở `components/panes.tsx`: một `<WidgetSlot id="ten-widget">` chứa `<Suspense fallback={<PanelSkeleton />}>` chứa widget. Không tạo registry tự quét; WidgetGrid tự đọc id từ các slot.
- Tương tác là điều hướng: sàn, nhóm, ngành, mã biểu đồ, bộ lọc tin đi qua searchParams và form GET (`?ex=`, `?nhom=`, `?nganh=`, `?ma=`, `?nguon=`). Không thêm state library. Chỉ dùng client component khi tương tác không làm được bằng server và URL. Island hiện có, mỗi cái kèm lý do:
  - `components/chart.tsx`: biểu đồ canvas; server gửi đủ 5 năm nến ~1300 bar một lần, nút 1m/3m/6m/1y/5y chỉ đổi viewport bằng `setVisibleLogicalRange`, pan trái xem được lịch sử cũ, không đi qua URL
  - `components/widget-grid.tsx`: kéo thả thứ tự widget, cùng nút Xuất/Nhập JSON
  - `components/column-resize.tsx`: kéo chỉnh độ rộng rail phải qua CSS variable
  - `components/theme-toggle.tsx`: sáng/tối
  - `components/rail-tabs.tsx`: tab ngang của rail phải; các pane là server component render sẵn, client chỉ toggle hiển thị
  - `components/rail-toggle.tsx`: ẩn/hiện rail phải, ghi class lên `<html>` để áp trước first paint
  - `components/nav-links.tsx`: đánh dấu mục đang mở bằng `usePathname()`
  - `components/mobile-menu.tsx`: mở/đóng menu điện thoại
  - `components/risk-calculator.tsx`: tính lại theo từng phím gõ và nhớ giá trị; server và URL chỉ làm được bằng một lần điều hướng mỗi phím
  - `components/whats-new.tsx`: badge version ở header mở changelog; popup tự hiện một lần cho phiên bản mới rồi tự tắt sau 10 giây
  - cộng `app/error.tsx`, vì Next.js bắt buộc error boundary là client component

  Island mới phải ghi lý do ở đây, và lý do đó phải là thứ server và URL không làm được.
- Mọi thứ app nhớ về người dùng nằm trong TRÌNH DUYỆT của họ, không bao giờ trên server. Hai chỗ: localStorage prefix `vnstock-starter:` (bố cục, theme, `rail-tab-v2` tab rail đang mở, `rail-collapsed` rail phải ẩn hay hiện, `risk-calc` bốn ô của máy tính rủi ro...) và cookie prefix `vnstock-starter-` (chỉ còn `-watchlist`). Watchlist phải là cookie chứ không phải localStorage vì server component render nó cần đọc được ngay lần render đầu, nếu không sẽ nháy; đọc qua `getWatchlist()` ở `lib/watchlist.ts`, sửa qua server action trong `app/actions.ts` (cookie set trong action làm trang tự re-render). Key/cookie mới phải theo đúng hai kênh này để nút Xuất/Nhập JSON (`LocalSettings`) tự gom được. `DEFAULT_WATCHLIST` trong `lib/watchlist.ts` là danh sách cho khách chưa có cookie.
- UI stack: token shadcn trong `app/globals.css` (`:root` + `@theme inline`) và primitives copy-in ở `components/ui/` (Button, Card, Table, Badge, Input). Dùng vocabulary shadcn: `bg-card`, `text-muted-foreground`, `text-primary`, `border-border`... Không hard-code màu hex trong component. Icon dùng `lucide-react`, cỡ mặc định `size-4`.
- Theme: tối là mặc định (`:root`), sáng là overrides trong `html.light`, toggle ở header. Thêm màu mới thì phải khai ở CẢ HAI block. Chart canvas không đọc được CSS nên `chart.tsx` đọc token qua `getComputedStyle` và tự vẽ lại khi class trên `<html>` đổi; màu riêng cho chart khai theo dạng `--chart-*`.
- Bề mặt liền mạch, không phải thẻ rời: khối ngăn nhau bằng hairline qua pattern container `gap-px bg-border` + ô con `bg-card`. `Panel` phẳng (không viền ngoài, không bo góc, không shadow). Đừng thêm `rounded`/`border` cho từng widget.
- App shell tràn màn hình: `body` là `h-screen overflow-hidden`, document không bao giờ cuộn. Thứ tự trên xuống: thanh điều hướng (header), dải chỉ số ngay dưới nó (render một lần, ở mọi kích thước), rồi nội dung và rail phải trong `app/layout.tsx`. Không có rail trái. Từ `xl` nội dung và rail tự cuộn riêng (`overflow-y-auto`); dưới `xl` rail xếp dưới nội dung và cả vùng cuộn chung. Không thêm `max-width` hay container bo góc.
- Mỗi mục là một route, render phía server. Danh sách mục ở `lib/nav.ts` (`NAV`): thêm mục = một dòng ở đó và `app/<slug>/page.tsx`. Trang mã là `/ma/[symbol]`; `/stock/:symbol` redirect vĩnh viễn sang đó trong `next.config.ts`. Pane của Thị trường, Bảng giá, Biểu đồ nằm trong `components/panes.tsx` và được các trang `/`, `/bang-gia`, `/bieu-do` gọi. Trang không thuộc `NAV` (như `/nguon-du-lieu`) vẫn là route bình thường, không có mục nào sáng trên thanh điều hướng.
- Cần primitive shadcn mới thì `npx shadcn@latest add <ten>`, nhưng component gốc Radix cần `"use client"` (dialog, dropdown, tabs...) thì phải cân nhắc vì tạo thêm client island. Mặc định là không.
- Bảng dùng primitives trong `components/ui/table.tsx`, vẫn là `<table>` thuần server-safe. Không data-grid library.
- Mã cổ phiếu trong danh sách hiển thị màu `text-primary` (xanh dương, kiểu FireAnt), riêng trang Bảng giá giữ màu theo trạng thái giá (đúng chất bảng điện). Màu giá lấy từ `lib/colors.ts` (tăng xanh, giảm đỏ, tham chiếu vàng, trần tím, sàn xanh lơ), giá trị hex khớp `:root` trong `app/globals.css`. Mọi số hiển thị mang class `num`.
- UI viết tiếng Việt. Code và comment tiếng Anh.
- Comment tiết chế: chỉ ghi ràng buộc mà code không tự nói được (đơn vị tiền, quy tắc cache, vì sao cookie thay vì localStorage...). Không kể lịch sử thay đổi, không tả lại điều code đã rõ, không separator comment. Đa số component không cần comment đầu file.
- Không thêm env var bắt buộc. App phải deploy được lên Vercel với zero cấu hình.

## Đơn vị dữ liệu

Sai đơn vị là loại lỗi hay gặp nhất, đọc kỹ:

- Giá cổ phiếu: nghìn VND (VCB 92.4 nghĩa là 92,400 VND), hiển thị 2 chữ số thập phân
- Chỉ số (VNINDEX...): điểm, không phải tiền, không chia cho gì cả
- `PriceBoardItem.totalValue`: TRIỆU VND, dùng `trieuToTy()` khi hiển thị tỷ
- Mọi trường tiền của `market.*` (overview, foreignFlow...): đã là tỷ VND, dùng `fmtTy()` thẳng

## Lệnh

- `npm run dev` — chạy local
- `npm run build` — build production, chạy trước khi kết luận một thay đổi xong
- `npm test` — test Vitest cho logic thuần trong `lib/` (file `lib/**/__tests__/*.test.ts`)
- `npm run typecheck` — kiểm kiểu bằng `tsc --noEmit`

## Dữ liệu khi đang code

MCP server `vnstock` có sẵn qua `.mcp.json` (không cần API key). Trước khi viết component cho một nguồn dữ liệu, gọi tool MCP tương ứng để xem shape thật thay vì đoán field. Ví dụ: `get_quote` cho bảng giá, `get_market_context` cho thị trường, `get_history` cho nến.
