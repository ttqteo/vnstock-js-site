import { BoardPane } from "@/components/panes";
import { normalizeExchange } from "@/lib/board";
import { normalizeGroup } from "@/lib/board-filter";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bảng giá · vnstock-js" };

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ ex?: string; nhom?: string; nganh?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <BoardPane
        exchange={normalizeExchange(sp.ex)}
        group={normalizeGroup(sp.nhom)}
        industry={sp.nganh?.trim() || undefined}
      />
    </div>
  );
}
