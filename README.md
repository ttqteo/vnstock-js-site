# vnstock-js-site

Dashboard chứng khoán Việt Nam miễn phí kiểu bảng điện, dựng trên [vnstock-js](https://github.com/ttqteo/vnstock-js) và Next.js. Bản chạy thật: [vnstock-js.vercel.app](https://vnstock-js.vercel.app).

Thanh điều hướng có năm mục, mỗi mục một đường dẫn riêng: Thị trường (độ rộng, dòng tiền, khối ngoại, bản đồ ngành), Bảng giá (chọn sàn hoặc nhóm VN30, VN100, HNX30 và lọc theo ngành), Biểu đồ (nến 5 năm của mọi mã và chỉ số), Danh mục (kèm máy tính rủi ro tính số cổ phiếu theo vốn và mức dừng lỗ) và Tin tức (lọc theo mã và nguồn). Dải chỉ số nằm ngay dưới thanh điều hướng, rail phải có Theo dõi, Tăng mạnh, Giảm mạnh và Tin tức.

Không chứa dữ liệu nhạy cảm: watchlist của mỗi người xem lưu ngay trên trình duyệt của họ (thêm bớt trên UI, xuất/nhập được bằng JSON), server không giữ danh sách của ai.

## Tự deploy bản của bạn

1. Fork repo này
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
