# 07 · Cảnh báo RSI trên trang chủ

Logic riêng của bạn chứ không chỉ hiển thị dữ liệu có sẵn. Widget này trả lời một câu hỏi: "trong watchlist có mã nào đang quá mua / quá bán không?"

## Prompt

```
Tạo widget widgets/rsi-alerts: quét các mã trong watchlist của người xem
(getWatchlist() ở lib/watchlist.ts), tính
RSI(14) từ lịch sử ngày (hàm rsi của vnstock-js), và chỉ hiện những mã
vượt ngưỡng: RSI >= 70 gắn nhãn "quá mua" màu đỏ, RSI <= 30 gắn nhãn
"quá bán" màu xanh.

Không mã nào vượt ngưỡng thì hiện "Không có cảnh báo" kèm mã có RSI cao
nhất và thấp nhất để ô không bao giờ trống vô nghĩa. Hàm dữ liệu cached
trong lib/board.ts, dùng chung phần lấy lịch sử với cột RSI của công thức
02 nếu đã làm. Đăng ký vào lưới.
```

## File sẽ đổi

- `lib/board.ts` — hàm RSI cho watchlist (hoặc tái dùng của công thức 02)
- `widgets/rsi-alerts/data.ts`, `widgets/rsi-alerts/index.tsx` — mới
- `components/panes.tsx` — một dòng đăng ký

## Kết quả

Mở trang chủ mỗi sáng là thấy ngay mã nào trong danh sách của mình đang ở vùng cực đoan. Từ khuôn này bạn chế tiếp cảnh báo riêng: giá cắt MA50, khối ngoại mua ròng 3 phiên liền, thanh khoản đột biến. Tất cả cùng một nhịp.
