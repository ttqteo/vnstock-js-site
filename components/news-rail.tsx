import { getTodayNews, type FinancialNews } from "@/lib/board";
import { fmtTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One headline row: title, source, time, link to the original article. No body text. */
export function NewsItem({ item, large }: { item: FinancialNews; large?: boolean }) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="flex gap-2.5 px-3 py-2 transition-colors hover:bg-muted/50"
      >
        {item.image && (
          /* Plain <img>: next/image would need a domain allowlist. */
          <img src={item.image} alt="" loading="lazy" className="size-12 shrink-0 rounded-md object-cover" />
        )}
        <span className="min-w-0">
          <span className={cn("line-clamp-2 leading-snug", large ? "text-[14px]" : "text-[13px]")}>{item.title}</span>
          <span className="mt-0.5 block text-[12px] text-muted-foreground">
            {item.source} · {fmtTimeAgo(item.publishedAt)}
          </span>
        </span>
      </a>
    </li>
  );
}

/** News pane of the right rail, fed by the SDK's news module. */
export async function NewsRail() {
  let items;
  try {
    items = await getTodayNews();
  } catch {
    return <p className="p-4 text-center text-[13px] text-muted-foreground">Không tải được tin. Thử lại sau ít phút.</p>;
  }

  if (items.length === 0) {
    return <p className="p-6 text-center text-[13px] text-muted-foreground">Chưa có tin hôm nay.</p>;
  }

  return (
    <ul data-testid="news-rail">
      {items.slice(0, 15).map((n) => (
        <NewsItem key={n.id} item={n} />
      ))}
    </ul>
  );
}
