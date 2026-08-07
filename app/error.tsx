"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Route error boundary. Next.js requires this file to be a client component;
 * it catches what the per-widget try/catch could not, so the shell survives. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-lg font-bold">Trang gặp lỗi</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">
        Nguồn dữ liệu có thể đang quá tải hoặc chặn tạm thời. Thử lại sau ít phút.
      </p>
      {error.digest && (
        <p className="num text-[12px] text-muted-foreground">Mã lỗi: {error.digest}</p>
      )}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={reset}>
          <RotateCw className="size-3.5" />
          Thử lại
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/">Về trang thị trường</Link>
        </Button>
      </div>
    </div>
  );
}
