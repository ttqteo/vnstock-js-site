import { Spinner } from "@/components/spinner";

/** Route-level fallback: covers the gap between clicking a workspace tab and
 * the next page streaming in. Nested routes reuse it unless they add their own. */
export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
      <Spinner className="size-6" />
      <p className="text-[13px] text-muted-foreground">Đang tải dữ liệu...</p>
    </div>
  );
}
