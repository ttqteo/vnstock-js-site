# vnstock-js-starter

Dashboard chứng khoán Việt Nam kiểu bảng điện, dựng trên [vnstock-js](https://github.com/ttqteo/vnstock-js) và Next.js. Fork về, sửa một file, deploy lên Vercel trong vài phút, rồi mở rộng bằng prompt với Claude Code.

Không chứa dữ liệu nhạy cảm: watchlist của mỗi người xem lưu ngay trên trình duyệt của họ (thêm bớt trên UI, xuất/nhập được bằng JSON), repo không giữ danh sách của ai. Deploy công khai thoải mái.

## 3 bước

1. Bấm **Use this template** để tạo repo của bạn
2. Import repo vào [Vercel](https://vercel.com/new) và Deploy. Không cần env var, không cần cấu hình

## Chạy local

```bash
npm install
npm run dev
```

## Mở rộng bằng prompt

Repo này được thiết kế để AI sửa đúng ngay lần đầu: `.mcp.json` cho Claude Code truy cập dữ liệu thị trường thật trong lúc viết code, `CLAUDE.md` giữ code sinh ra đúng quy ước.

- `prompts/` có 8 công thức xếp từ dễ tới khó, copy nguyên văn vào Claude Code
- `widgets/_template/` là khuôn để copy nếu muốn tự viết tay

## Giới hạn

Dữ liệu cập nhật mỗi 60 giây (ISR), không phải realtime nhấp nháy như bảng điện công ty chứng khoán. Không có tự doanh, không có phái sinh.
