# 08 · Module danh mục (đọc phần bảo mật trước)

Công thức duy nhất chạm dữ liệu nhạy cảm: danh mục thật của bạn, số lượng và giá vốn. Nó nằm cuối cùng có chủ đích, và khác mọi công thức trước ở một điểm: dữ liệu KHÔNG nằm trong repo.

## Ba tầng rò rỉ phải hiểu trước khi làm

| Tầng | Rò cái gì | Cách bịt |
|---|---|---|
| Git repo | File danh mục nằm lại vĩnh viễn trong lịch sử commit, kể cả sau khi xoá | Danh mục vào env var, không bao giờ vào git |
| URL production | Repo private KHÔNG làm URL Vercel private. Vercel Hobby cho production public, password protection là tính năng trả phí | Basic auth bằng middleware, mật khẩu trong env var |
| API route | Route trả JSON thô thì ai cũng curl được | Không tạo API route cho danh mục, chỉ render server |

## Prompt

```
Thêm trang /danh-muc, bảo vệ bằng mật khẩu:

1. Danh mục đọc từ env var PORTFOLIO_JSON dạng
   [{"symbol":"VCB","qty":200,"cost":92.4}], parse bằng try/catch, thiếu
   hoặc sai định dạng thì trang hiện hướng dẫn cấu hình thay vì lỗi.
2. Tạo middleware.ts chặn riêng /danh-muc bằng HTTP Basic Auth, mật khẩu
   so với env var DASHBOARD_PASSWORD. Thiếu env var này thì /danh-muc trả
   404 luôn (mặc định đóng). Các trang khác giữ nguyên public.
3. Trang hiện bảng: mã, số lượng, giá vốn, giá hiện tại (từ getBoard hoặc
   getSymbolBoard), lãi lỗ tuyệt đối và %, cộng tổng cuối bảng. Giá cổ
   phiếu là nghìn VND, tính tiền cho đúng đơn vị.
4. Không tạo API route nào cho danh mục. Không log giá trị PORTFOLIO_JSON.
5. Thêm .env.example ghi hai biến kèm chú thích, và thêm link "Danh mục"
   vào nav.
```

## Cấu hình trên Vercel

Settings → Environment Variables: thêm `PORTFOLIO_JSON` và `DASHBOARD_PASSWORD`, redeploy. Đổi danh mục là sửa env var chứ không phải sửa code, nên không có commit nào chứa tiền của bạn.

## File sẽ đổi

- `app/danh-muc/page.tsx`, `middleware.ts`, `.env.example` — mới
- `app/layout.tsx` — một link nav

## Kết quả

Trang lãi lỗ của riêng bạn, sau một lớp mật khẩu, còn repo thì vẫn sạch: fork của bạn có thể để public, URL có thể khoe, và không đâu trong git có con số nào của bạn.
