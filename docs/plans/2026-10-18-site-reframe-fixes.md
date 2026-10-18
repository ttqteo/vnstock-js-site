# vnstock-js-site: sửa lỗi sau đổi khung

**Spec:** `docs/plans/2026-10-14-site-redesign-design.md` (mục "Khung điều hướng" và bước 1 của "Thứ tự")
**Setup:** `npm ci`
**Check:** `npm run typecheck`
**Verify:** `npm test && npm run build`
**Final:** `npx playwright install chromium && npm run build && node scripts/final-check.mjs`

Vòng sửa cho ba lỗi còn lại sau khi đổi khung: máy tính rủi ro làm tròn thiếu một lô vì sai số dấu phẩy động, link cũ `/?tab=` trả 200 kèm meta refresh thay vì redirect thật, và ô chọn ngành không khớp khi `nganh` không có trong nguồn đang xem.

Ghi chú chung cho mọi task:
- Đọc `CLAUDE.md` của repo trước; quy ước ở đó áp dụng.
- UI tiếng Việt, code và comment tiếng Anh, comment tiết chế. Commit message tiếng Anh, không em-dash, không dòng Co-Authored-By.
- Mỗi bước Final mà task nêu tên là một phần của tiêu chí chấp nhận task đó.

### Task 1: Máy tính rủi ro không làm tròn thiếu một lô
**Depends on:** none
**Files:** `lib/risk.ts`, `lib/__tests__/risk.test.ts`

`positionSize` tính `byRisk` bằng `Math.floor((capital * riskPct) / 100 / perShareRisk / LOT) * LOT`. Khi kết quả đúng ra là số nguyên mà dấu phẩy động cho ra hơi thấp hơn, `floor` mất một lô. Ví dụ `positionSize({ capital: 1e8, riskPct: 2.3, entry: 20.9, stop: 19.9 })` trả 2200 cổ phiếu, đúng phải là 2300 (ngân sách 2.300.000 đ, rủi ro 1.000 đ mỗi cổ phiếu).

Sửa để phép chia lô ra đúng số nguyên khi thương số thực là số nguyên: cộng một epsilon nhỏ (ví dụ `1e-9`) vào thương số trước `Math.floor`, hoặc dùng số học nguyên. Áp cùng cách cho `byCapital`. Kết quả không bao giờ được vượt mức rủi ro thật: `riskAmount <= capital * riskPct / 100` vẫn phải đúng.

Thêm vào `lib/__tests__/risk.test.ts`:
- test ví dụ trên trả `shares: 2300`;
- test quét: với capital trong `[5e7, 1e8, 2.5e8, 1e9]`, riskPct từ 0.1 đến 10 bước 0.1 (làm tròn 1 chữ số), và các cặp entry/stop `[20.9, 19.9]`, `[50, 48]`, `[12.35, 11.85]`, `[100, 95]`: mọi kết quả `ok` có `riskAmount <= capital * riskPct / 100 + 1e-6`, và với `byRisk` thì `shares + 100` cổ phiếu sẽ vượt ngân sách rủi ro hoặc vượt vốn (nghĩa là không thiếu lô nào).

Năm test cũ giữ nguyên và vẫn xanh.

Chấp nhận: `npx vitest run lib/__tests__/risk.test.ts` xanh với các test mới; typecheck xanh. Kiểm ở Final, bước `risk-calc` (không đổi).

### Task 2: Link cũ `/?tab=` redirect thật
**Depends on:** none
**Files:** `next.config.ts`, `app/page.tsx`, `scripts/final-check.mjs`

`app/page.tsx` gọi `redirect()` cho `?tab=bang-gia` và `?tab=bieu-do`, nhưng `app/loading.tsx` làm trang stream trước nên trình duyệt nhận HTTP 200 kèm `<meta http-equiv="refresh">` và redirect phía client. Client không chạy JS (curl, crawler) không thấy redirect.

Chuyển hai redirect này sang `redirects()` trong `next.config.ts`, cạnh redirect `/stock/:symbol`: `source: "/"`, `has: [{ type: "query", key: "tab", value: "bang-gia" }]`, `destination: "/bang-gia"`, `permanent: true`; tương tự `bieu-do` sang `/bieu-do`. Sửa comment phía trên khối `redirects` cho đủ cả hai loại link cũ. Trong `app/page.tsx` bỏ `OLD_TABS`, nhánh `redirect` và import `redirect`; `searchParams` chỉ còn `ex`.

Next.js giữ query của request khi redirect, nên đích có thể là `/bang-gia?tab=bang-gia`; `/bang-gia` bỏ qua `tab`, chấp nhận được. Nếu bỏ được query thừa mà không thêm middleware thì làm.

`scripts/final-check.mjs`, bước `redirects`: bỏ comment về streamed 200. Trước khi điều hướng, kiểm bằng `page.request.get(\`${BASE}/?tab=bang-gia\`, { maxRedirects: 0 })`: status là 307 hoặc 308 và header `location` có pathname `/bang-gia`; làm tương tự cho `/?tab=bieu-do` (pathname `/bieu-do`) và `/stock/FPT` (pathname `/ma/FPT`). Sau đó vẫn `goto` và kiểm path như hiện có.

Chấp nhận: typecheck và build xanh; `curl -s -o /dev/null -w "%{http_code}" "http://localhost:<port>/?tab=bang-gia"` trên `next start` ra 307 hoặc 308. Kiểm ở Final, bước `redirects`.

### Task 3: Ô chọn ngành khớp với `nganh` đang lọc
**Depends on:** Task 2
**Files:** `components/panes.tsx`, `scripts/final-check.mjs`

Khi `nganh` trên URL không có trong danh sách ngành của sàn hoặc nhóm đang xem (link cũ, URL sửa tay), `IndustryFilter` hiện "Tất cả ngành" trong khi bảng đã lọc ra rỗng. Người xem thấy bảng trống mà ô chọn nói không lọc gì.

Trong `IndustryFilter`: nếu có `industry` và nó không nằm trong `industries`, thêm một `<option value={industry}>` cho nó (đặt sau "Tất cả ngành"), để `defaultValue` khớp. Trong `Board`: khi có `industry` và danh sách sau lọc rỗng, render trong `Panel` (vẫn tiêu đề như hiện có) một dòng `text-[13px] text-muted-foreground px-3 py-2` "Không có mã nào thuộc ngành này trong {source}." thay cho bảng trống.

`scripts/final-check.mjs`, cuối bước `board-group`: mở `/bang-gia?nhom=VN30&nganh=Khong-co-nganh`, `main select[name="nganh"]` có value `Khong-co-nganh` (nếu select được render) và text của `main` chứa "Không có mã nào thuộc ngành này".

Chấp nhận: typecheck và build xanh. Kiểm ở Final, bước `board-group`.
