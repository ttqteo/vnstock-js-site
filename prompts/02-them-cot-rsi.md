# 02 · Thêm RSI vào trang chi tiết mã

Sửa một trang có sẵn. Bài này cho thấy Claude đọc quy ước trong `CLAUDE.md` và tự biết phải thêm hàm dữ liệu vào `lib/board.ts` chứ không gọi mạng trong trang.

## Prompt

```
Thêm chỉ số RSI(14) vào panel "Phiên hôm nay" của trang chi tiết mã
(app/ma/[symbol]/page.tsx).

RSI tính từ lịch sử giá ngày bằng hàm rsi của vnstock-js, tận dụng
getStockHistory đã có trong lib/board.ts. Giá trị hiển thị 1 chữ số thập
phân, tô màu: dưới 30 xanh (quá bán), trên 70 đỏ (quá mua), còn lại màu
mặc định. Thiếu lịch sử thì hiện dấu gạch.
```

## File sẽ đổi

- `lib/board.ts` — thêm hàm cached tính RSI từ lịch sử đã có
- `app/ma/[symbol]/page.tsx` — thêm dòng RSI vào panel Phiên hôm nay

## Kết quả

Mở bất kỳ mã nào cũng thấy RSI đứng cạnh các số liệu phiên, không thêm lời gọi mạng nào mới vì lịch sử giá đã được fetch sẵn cho biểu đồ.
