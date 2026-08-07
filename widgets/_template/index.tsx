// Bước 3: async server component. Bọc lời gọi data trong try/catch và trả
// PanelError khi lỗi, để một widget hỏng không kéo trắng cả trang.
// File này không gọi mạng; mọi dữ liệu đi qua data.ts.
import { Panel, PanelError } from "@/components/panel";
import { fmtTy } from "@/lib/format";
import type { Exchange } from "@/lib/board";
import { getExampleData } from "./data";

export async function ExampleWidget({ exchange, className = "" }: { exchange: Exchange; className?: string }) {
  let rows;
  try {
    rows = await getExampleData(exchange);
  } catch {
    return <PanelError title="Widget mẫu" className={className} />;
  }

  return (
    <Panel title="Widget mẫu" className={className}>
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.symbol} className="flex justify-between text-[13px]">
            <span className="font-semibold">{row.symbol}</span>
            <span className="num text-muted-foreground">{fmtTy(row.valueTy)}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// Bước 4: đăng ký widget. Mở app/page.tsx, thêm một slot vào cuối WidgetGrid:
//
//   <WidgetSlot id="widget-mau">
//     <Suspense fallback={<PanelSkeleton title="Widget mẫu" />}>
//       <ExampleWidget exchange={ex} />
//     </Suspense>
//   </WidgetSlot>
//
// Việc đăng ký là thủ công có chủ đích: một khối nhìn thấy được, không có
// registry tự quét nào phải hiểu. id chỉ cần duy nhất trong lưới; thứ tự
// kéo thả của người dùng lưu theo id đó.
