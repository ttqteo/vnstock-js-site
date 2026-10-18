import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-3 py-2 text-[12px] text-muted-foreground">
      Miễn phí toàn bộ, không có gói trả phí. Dữ liệu trễ tối thiểu 60 giây, không phải khuyến nghị đầu tư.{" "}
      <Link href="/nguon-du-lieu" className="text-primary hover:underline">
        Nguồn và phương pháp
      </Link>
    </footer>
  );
}
