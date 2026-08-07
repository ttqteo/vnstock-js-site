# 01 · Đổi danh sách mặc định

Công thức duy nhất không cần AI. Làm tay một lần để thấy vòng lặp sửa → push → deploy trước khi giao vòng lặp đó cho Claude.

Watchlist của mỗi người xem nằm trong trình duyệt của họ (cookie), thêm bớt ngay trên UI, không đụng gì tới code. Thứ nằm trong code là **danh sách mặc định** mà khách mới thấy lần đầu tiên.

## Làm gì

Mở `lib/watchlist.ts`, sửa hằng số:

```ts
export const DEFAULT_WATCHLIST = ["VNM", "VIC", "TCB"];
```

Rồi:

```bash
git add lib/watchlist.ts
git commit -m "doi danh sach mac dinh"
git push
```

## Kết quả

Vercel tự deploy lại sau khoảng một phút. Mở web ở chế độ ẩn danh (chưa có cookie) sẽ thấy danh sách mới. Danh sách riêng bạn đã chỉnh trên UI không bị ảnh hưởng, vì nó nằm trong trình duyệt của bạn chứ không nằm trong repo.

Đây chính là cơ chế mà mọi công thức sau dựa vào, chỉ khác là từ giờ Claude sửa code thay bạn.
