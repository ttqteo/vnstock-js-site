import type { Metadata } from "next";
import { NewsItem } from "@/components/news-rail";
import { Panel, PanelError } from "@/components/panel";
import { Tabs } from "@/components/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getNews, getTodayNews } from "@/lib/board";
import { filterBySource, sourcesOf } from "@/lib/news-filter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tin tức · vnstock-js" };

const SYMBOL = /^[A-Za-z0-9]{3,10}$/;
const MAX_SOURCE_TABS = 8;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ ma?: string; nguon?: string }>;
}) {
  const sp = await searchParams;
  const ma = typeof sp.ma === "string" && SYMBOL.test(sp.ma) ? sp.ma.toUpperCase() : undefined;
  const nguon = typeof sp.nguon === "string" && sp.nguon ? sp.nguon : undefined;

  let items;
  try {
    items = ma ? await getNews(ma) : await getTodayNews();
  } catch {
    items = null;
  }

  const title = ma ? `Tin tức ${ma}` : "Tin tức thị trường";
  const sources = items ? sourcesOf(items).slice(0, MAX_SOURCE_TABS) : [];
  const shown = items ? filterBySource(items, nguon) : [];

  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <div className="flex flex-wrap items-center gap-2 bg-card px-2 py-1.5">
        <form action="/tin-tuc" method="get" className="flex items-center gap-1.5">
          <Input
            name="ma"
            defaultValue={ma ?? ""}
            placeholder="Lọc theo mã"
            aria-label="Lọc theo mã"
            autoComplete="off"
            className="h-7 w-32"
          />
          <Button type="submit" variant="outline" size="sm">
            Lọc
          </Button>
        </form>
        {sources.length > 0 && (
          <Tabs
            items={[
              { label: "Tất cả", href: newsHref(ma), active: !nguon },
              ...sources.map((s) => ({
                label: s,
                href: newsHref(ma, s),
                active: nguon?.toLowerCase() === s.toLowerCase(),
              })),
            ]}
          />
        )}
      </div>

      {items === null ? (
        <PanelError title={title} className="flex-1" />
      ) : (
        <Panel
          title={title}
          pad={false}
          className="flex-1"
          right={<span className="num text-[12px] text-muted-foreground">{shown.length} tin</span>}
        >
          {shown.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">Không có tin phù hợp.</p>
          ) : (
            <ul data-testid="news-list">
              {shown.map((n) => (
                <NewsItem key={n.id} item={n} large />
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}

function newsHref(ma: string | undefined, nguon?: string): string {
  const q = new URLSearchParams();
  if (ma) q.set("ma", ma);
  if (nguon) q.set("nguon", nguon);
  const s = q.toString();
  return s ? `/tin-tuc?${s}` : "/tin-tuc";
}
