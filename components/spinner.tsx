import { cn } from "@/lib/utils";

/** Loading indicator. Pure CSS so it stays a server component. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary",
        className
      )}
    />
  );
}
