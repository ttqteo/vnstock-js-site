# vnstock-js-site: thiết kế lại khung và lộ trình

Ngày: 2026-10-14. Trạng thái: thiết kế đã duyệt, chưa triển khai.

Site: vnstock-js.vercel.app, repo `ttqteo/vnstock-js-site` (trước là vnstock-js-starter, thư mục local vẫn là `vnstock-js-starter`).

Liên quan:
- Spec v2: `D:/ttqspace/nnew/vnstock-js-roadmap/docs/superpowers/specs/2026-10-14-v2.0.0-design.md` (mốc M1 đến M5, mục "Starter site").
- Chỉ báo: `2026-10-14-free-indicators-design.md` và kế hoạch `2026-10-14-starter-indicators-ui.md` (cùng thư mục).

## Mục tiêu

Biến site từ một dashboard một trang thành sản phẩm kiểu FireAnt/KungfuStock/Uptrend bản miễn phí: nhiều mục, mỗi mục một URL, tín hiệu giao dịch tự động kèm kế hoạch và thành tích công khai. Ưu tiên máy tính, điện thoại dùng được.

Ràng buộc giữ nguyên: Next.js + Vercel, không database, không đăng nhập, dữ liệu người dùng nằm trong trình duyệt, fork về vẫn deploy không cần cấu hình. Server Docker riêng chỉ là phần thêm qua biến môi trường.

## Khung điều hướng

Thanh điều hướng trên cùng, mỗi mục là một route. Khi số mục vượt khoảng 8 thì cân nhắc chuyển sang sidebar dọc có chữ như Uptrend.

Header một hàng:
- Trái: logo vnstock-js, các mục **Thị trường · Bảng giá · Biểu đồ · Cơ hội · Phân tích · Danh mục · Tin tức**, mục đang mở tô sáng. Bước Đổi khung chỉ có 5 mục Thị trường · Bảng giá · Biểu đồ · Danh mục · Tin tức; Cơ hội vào cùng M1, Phân tích cùng M2, khi trang của chúng có thật.
- Phải: tìm mã, nút thu rail, Tài liệu, GitHub, theme, xuất/nhập cài đặt, có gì mới.

Dải 4 thẻ chỉ số (VNINDEX, HNX, UPCOM, VN30) gồm điểm, thay đổi %, sparkline nằm trên một hàng mỏng riêng ngay dưới header, ở mọi kích thước màn hình; bấm vào sang biểu đồ chỉ số đó.

| Route | Nội dung |
|---|---|
| `/` | Thị trường |
| `/bang-gia` | Bảng điện, `?ex=HOSE`, `?nhom=VN30` |
| `/bieu-do` | Chart lớn, `?ma=FPT` |
| `/co-hoi` | Tín hiệu hôm nay và bộ lọc |
| `/co-hoi/hieu-qua` | Thành tích các tín hiệu đã phát |
| `/phan-tich` | So sánh định giá trong ngành |
| `/danh-muc` | Danh mục, nhật ký giao dịch, máy tính rủi ro |
| `/tin-tuc` | Dòng tin lọc theo mã và nguồn |
| `/ma/[symbol]` | Trang mã, tab Tổng quan · Biểu đồ · Tài chính · Sự kiện · Tin tức (Đổi khung giữ trang mã một trang như hiện có; tách tab cùng M2 khi có Tài chính) |
| `/nguon-du-lieu` | Nguồn dữ liệu, phương pháp, miễn trừ trách nhiệm |

`/stock/:symbol` redirect 308 sang `/ma/:symbol` trong `next.config.ts`.

Bố cục: hai cột. Trái là nội dung route. Phải là rail kéo được độ rộng, tab **Theo dõi · Tăng mạnh · Giảm mạnh · Tin tức**; nút thu rail nằm ở header trên mọi trang (cần nhất ở `/bieu-do` và `/bang-gia`), nhớ theo trình duyệt. Rail trái cũ (danh sách chỉ số) bỏ, vì chỉ số đã lên header.

Điện thoại: header còn logo, tìm mã, nút menu; các mục trong menu trượt; dải chỉ số cuộn ngang; rail xuống cuối trang; bảng giá cuộn ngang.

Bỏ cookie `vnstock-starter-tab` và server action `loadPane`, vì tab giữa giờ là route.

## Nội dung từng mục

| Mục | Nội dung | Mốc v2 |
|---|---|---|
| Thị trường | Heatmap, độ rộng, dòng tiền, khối ngoại như hiện có. Thêm thanh khoản tích lũy hôm nay so với hôm qua, khối ngoại theo phút, đồng hồ tâm lý và rủi ro (công thức tự định nghĩa, công khai trong docs) | M3 |
| Bảng giá | Như hiện có, thêm chọn nhóm (VN30, ngành) | Đổi khung |
| Biểu đồ | Chart lớn và bảng chỉ báo | M1 |
| Cơ hội | Tín hiệu hôm nay kèm kế hoạch; bộ lọc theo chỉ số và tín hiệu; tỷ lệ thắng lịch sử | Tín hiệu và lọc ở M1, tỷ lệ thắng ở M4 |
| Phân tích | So sánh P/E, P/B, ROE trong ngành, xếp hạng mã, dùng `ratios.json` | M2 |
| Danh mục | Portfolio nhiều broker, lãi/lỗ, tỷ trọng theo ngành, nhật ký giao dịch, máy tính rủi ro | M2; máy tính rủi ro làm ngay |
| Trang mã | Tách tab Tổng quan · Biểu đồ · Tài chính · Sự kiện · Tin tức, thêm Tài chính | M2 |
| Tin tức | Trang riêng, chỉ tiêu đề và link nguồn | Đổi khung |

Footer mọi trang: "Miễn phí toàn bộ, không có gói trả phí" và link `/nguon-du-lieu`.

Ngoài phạm vi: trợ lý AI kiểu "Hỏi Master" (cần API key mô hình và chi phí mỗi câu hỏi; sau này có thể cho người dùng tự nhập key), Cộng đồng, đăng nhập.

## Tín hiệu, kế hoạch giao dịch và thành tích

Giá trị cốt lõi của các app trả phí là khuyến nghị. Site làm phần này dưới dạng tín hiệu kỹ thuật tự động theo quy tắc công khai.

Ranh giới: tư vấn đầu tư chứng khoán ở VN là nghiệp vụ cần giấy phép. Site không nói "nên mua", không dùng chữ "Khuyến nghị". Ngôn từ là "Tín hiệu" và "Kế hoạch tham khảo", kèm miễn trừ trách nhiệm cố định.

Mỗi tín hiệu gồm:
- Loại tín hiệu (Turtle thuận xu hướng, vùng đáy kèm mẫu nến đảo chiều, FTD...), ngày, giá đóng cửa.
- Kế hoạch: vùng giá vào, dừng lỗ (chặt hơn trong hai mức: 2×ATR hoặc dưới vùng hỗ trợ gần nhất), mục tiêu 1 (vùng kháng cự gần nhất hoặc 2R), mục tiêu 2 (3R), tỷ lệ R:R. Chỉ phát tín hiệu có R:R từ 1,5. Hết hạn sau 20 phiên.
- Bối cảnh: trạng thái thị trường theo FTD/ngày phân phối; từ M4 thêm tỷ lệ thắng, lợi nhuận trung bình và số phiên giữ trung bình của đúng loại tín hiệu trong 2 năm (backtest của v2).

Danh sách "Tín hiệu hôm nay" xếp theo R:R và độ tin cậy lịch sử, là phần chính của `/co-hoi`, và hiện trên trang mã.

Thành tích công khai: mọi tín hiệu đã phát được lưu lại; mỗi ngày tự chấm kết quả (chạm mục tiêu 1, mục tiêu 2, dừng lỗ, hết hạn) theo giá thật. `/co-hoi/hieu-qua` hiện tổng hợp theo loại tín hiệu và danh sách từng tín hiệu. Không xóa hay sửa tín hiệu cũ. Thành tích chỉ có từ ngày workflow chạy, nên bật workflow càng sớm càng tốt.

## Kiến trúc dữ liệu

Lớp dữ liệu: mọi lời gọi mạng trong `lib/board.ts`, cache tối thiểu 60 giây, trang và widget là server component. Trước core Task 19 dùng API v1, sau đó dùng API v2.

Việc nặng tính trước bằng GitHub Actions:
- Workflow `signals.yml` trong repo site, chạy 16:00 ngày giao dịch (bỏ ngày lễ theo `holidays.json`): lấy nến các mã, tính tín hiệu và kế hoạch bằng `vnstock-js/indicators`, chấm kết quả các tín hiệu còn mở, ghi `signals/latest.json` và `signals/history/YYYY-MM.json`.
- Dữ liệu ghi vào nhánh `data` của repo site, không ghi vào nhánh chính, để mỗi lần cập nhật không kích hoạt deploy. Cấu hình Vercel bỏ qua build cho nhánh `data`. Site đọc qua raw GitHub (cho phép CORS), cache theo ngày.
- Phân tích ngành dùng `ratios.json` dựng sẵn của vnstock-js; lịch sử khối ngoại dùng recorder của v2.
- Dữ liệu trong phiên ở M3: thanh khoản lấy từ nến 1 phút của chỉ số theo request; khối ngoại theo phút cần ghi liên tục, chỉ bật khi có server Docker qua biến môi trường.

Client island: bỏ quy tắc "đúng 7 client component", thay bằng nguyên tắc chỉ dùng client khi tương tác không làm được bằng server và URL. Bộ lọc và chọn sàn là form GET trên `searchParams`. Island mới: `nav-links.tsx` (tô sáng mục, cần `usePathname`), `mobile-menu.tsx`, bảng chỉ báo trong chart, `portfolio/*` (IndexedDB), `risk-calculator.tsx`.

Dữ liệu người dùng: watchlist ở cookie; tab rail đang chọn ở localStorage; cài đặt ở localStorage prefix `vnstock-starter:`; danh mục ở IndexedDB database `vnstock-starter`, qua adapter cài đặt interface `Storage` của v2. Nút Xuất/Nhập JSON gom cả danh mục; trang Danh mục nhắc sao lưu vì đó là cách sao lưu duy nhất.

## Lỗi

- Một widget hỏng chỉ trắng một ô.
- File tín hiệu thiếu hoặc cũ hơn 3 ngày giao dịch: `/co-hoi` ghi rõ ngày dữ liệu, không trình bày tín hiệu cũ như mới.
- Workflow lỗi giữa chừng không ghi đè `latest.json` bằng dữ liệu dở dang: ghi file tạm, kiểm tra, rồi mới thay.

## Kiểm thử

- Vitest cho code thuần: tạo tín hiệu và kế hoạch, chấm kết quả, tính danh mục, máy tính rủi ro.
- Script workflow chạy được local trên fixture trước khi bật cron.
- `npm run build` và smoke test trên VCI thật cho từng route.

## Thứ tự

1. **Đổi khung** (chạy trên vnstock-js 1.x): header và nav, route, redirect, rail tab, trang tin tức, `/nguon-du-lieu`, máy tính rủi ro.
2. **M1:** chỉ báo trên chart (kế hoạch đã có), workflow tín hiệu và trang Cơ hội (bật sớm để tích thành tích), `/co-hoi/hieu-qua`.
3. **M2:** Danh mục, Phân tích, tab Tài chính.
4. **M3:** dashboard trong phiên, đồng hồ tâm lý và rủi ro.
5. **M4:** tỷ lệ thắng lịch sử cho tín hiệu bằng backtest.
6. Production lên v2 cùng ngày phát hành 2.0.0.
