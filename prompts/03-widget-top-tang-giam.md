# 03 · Widget top tăng giảm

Widget đầu tiên của bạn trên lưới trang chủ. Bài này dạy nhịp chuẩn: copy khuôn, hai file, đăng ký một slot.

## Prompt

```
Tạo widget mới widgets/top-movers theo khuôn widgets/_template: top 5 mã
tăng mạnh nhất và top 5 mã giảm mạnh nhất của sàn đang chọn, tính theo %
so với tham chiếu, chỉ lấy mã có giá trị giao dịch trên 1 tỷ để loại mã
không thanh khoản.

Hai cột cạnh nhau, mỗi dòng gồm mã (link tới /stock/mã), giá và %. Đăng ký
vào cuối WidgetGrid ở components/panes.tsx bằng một WidgetSlot id="top-movers".
```

## File sẽ đổi

- `widgets/top-movers/data.ts` — mới, lọc và xếp hạng từ `getBoard()`
- `widgets/top-movers/index.tsx` — mới
- `components/panes.tsx` — thêm một dòng đăng ký

## Kết quả

Lưới trang chủ có thêm ô "Top tăng giảm" đổi theo tab HSX/HNX/UPCOM, dữ liệu lấy từ đúng lời gọi bảng giá đã cache mà các widget khác dùng chung, không thêm lời gọi mạng nào.
