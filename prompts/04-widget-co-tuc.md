# 04 · Widget cổ tức sắp tới

Bài đầu tiên chạm một nguồn dữ liệu app chưa dùng. Dạy cách mở rộng `lib/board.ts` đúng kiểu: thêm một hàm cached, rồi widget chỉ import.

## Prompt

```
Tạo widget widgets/dividends: sự kiện cổ tức sắp tới của các mã trong
watchlist của người xem (lấy qua getWatchlist() ở lib/watchlist.ts).

vnstock-js có API sự kiện doanh nghiệp (dùng MCP tool get_dividends hoặc
get_corporate_events để xem shape thật trước). Thêm hàm cached vào
lib/board.ts với revalidate 1 giờ vì lịch cổ tức đổi chậm. Mỗi dòng: mã,
loại sự kiện, ngày GDKHQ, giá trị. Không có sự kiện nào thì ghi rõ thay vì
để trống. Đăng ký vào lưới ở components/panes.tsx.
```

## File sẽ đổi

- `lib/board.ts` — thêm hàm cached mới
- `widgets/dividends/data.ts`, `widgets/dividends/index.tsx` — mới
- `components/panes.tsx` — một dòng đăng ký

## Kết quả

Ô mới hiện lịch cổ tức của đúng các mã bạn theo dõi. Điểm đáng để ý là Claude gọi MCP xem shape dữ liệu thật trước khi viết code, nên field không bị bịa.
