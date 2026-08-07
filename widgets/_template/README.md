# Thêm widget mới

Folder này không được route (tên bắt đầu bằng `_`). Nó là khuôn để copy.

## Bằng tay

1. Copy folder này thành `widgets/<ten-widget>/`
2. Sửa `data.ts` (lấy dữ liệu) và `index.tsx` (render), theo comment đánh số trong file
3. Đăng ký một `<WidgetSlot>` trong `app/page.tsx` (xem cuối `index.tsx`)

## Bằng prompt

Mở Claude Code tại repo này và dùng công thức trong `prompts/03-widget-top-tang-giam.md`, hoặc mô tả widget bạn muốn. Quy ước trong `CLAUDE.md` sẽ giữ cho code sinh ra cùng hình dạng với code có sẵn.

## Quy tắc

- `data.ts` không import React. `index.tsx` không gọi mạng.
- Dữ liệu đi qua `lib/board.ts`, không gọi `vnstock-js` trực tiếp.
- Bọc `<Panel>`, lỗi trả `<PanelError>`.
