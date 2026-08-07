# 05 · Đổi giao diện

Chạm phần trình bày mà không đụng dữ liệu. App dùng token shadcn: toàn bộ theme nằm ở block `:root` trong `app/globals.css`, cộng `COLORS` trong `lib/colors.ts` cho biểu đồ (canvas không đọc được CSS).

## Prompt

```
Đổi giao diện sang nền sáng: --background trắng ngà, --card trắng,
--border xám nhạt, --foreground gần đen, --primary giữ xanh dương. Chỉ sửa
block :root trong app/globals.css, không sửa component nào.

Giữ nguyên 5 màu trạng thái giá (tăng/giảm/tham chiếu/trần/sàn) nhưng
chỉnh cho đủ tương phản trên nền sáng, và sửa COLORS trong lib/colors.ts
khớp theo vì biểu đồ đọc màu từ đó.
```

Muốn giữ nền tối thì đổi ý prompt: màu nhấn khác, bo góc khác (`--radius`), mật độ khác. Cấu trúc không đổi.

## File sẽ đổi

- `app/globals.css` (chỉ block `:root`)
- `lib/colors.ts`

## Kết quả

Toàn bộ app đổi theme trong một lần vì component chỉ dùng token (`bg-card`, `text-muted-foreground`...), không có màu hex nào hard-code. Nếu Claude phát hiện chỗ nào lỡ hard-code, nó sẽ dồn về hai file trên, và đó chính là việc bạn muốn nó làm.
