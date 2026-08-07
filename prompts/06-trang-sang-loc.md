# 06 · Trang sàng lọc

Không chỉ widget nữa mà nguyên một trang, có form điều kiện. Dạy quy tắc "tương tác là URL" ở mức khó hơn: form submit bằng GET, điều kiện nằm trong searchParams.

## Prompt

```
Tạo trang /sang-loc: sàng lọc cổ phiếu theo điều kiện.

Form gồm: sàn (HOSE/HNX/UPCOM), khối lượng tối thiểu, % thay đổi từ/đến.
Form là thẻ form method GET submit về chính trang, mọi điều kiện nằm trong
searchParams để URL chia sẻ được. Không dùng client state.

Lọc từ dữ liệu getBoard() có sẵn trong lib/board.ts. Kết quả là bảng: mã,
giá, %, khối lượng, giá trị, mỗi mã link tới trang chi tiết. Thêm link
"Sàng lọc" vào nav trong app/layout.tsx.
```

## File sẽ đổi

- `app/sang-loc/page.tsx` — mới
- `app/layout.tsx` — thêm một link nav

## Kết quả

Trang sàng lọc chạy hoàn toàn server-side, URL kiểu `/sang-loc?ex=HOSE&minVol=1000000&from=2` gửi cho bạn bè là họ thấy đúng kết quả đó. Bước tiếp theo tự nhiên là thêm điều kiện PE/ROE bằng module screening của vnstock-js, cứ hỏi Claude.
