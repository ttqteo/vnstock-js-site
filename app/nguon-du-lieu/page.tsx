import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Panel } from "@/components/panel";

export const metadata: Metadata = { title: "Nguồn dữ liệu và phương pháp · vnstock-js" };

export default function DataSourcePage() {
  return (
    <div className="flex min-h-full flex-col gap-px bg-border">
      <div className="bg-card px-3 py-2">
        <h1 className="text-lg font-bold">Nguồn dữ liệu và phương pháp</h1>
      </div>
      <Panel title="Nguồn, phương pháp và miễn trừ" className="flex-1">
        <div className="space-y-4 text-[14px] leading-relaxed">
          <Item title="Dữ liệu giá và thị trường">
            Lấy từ VCI qua thư viện mã nguồn mở vnstock-js (
            <ExternalLink href="https://github.com/ttqteo/vnstock-js">GitHub</ExternalLink>,{" "}
            <ExternalLink href="https://vnstock-js-docs.vercel.app">tài liệu</ExternalLink>). Cập nhật trễ tối thiểu 60
            giây.
          </Item>
          <Item title="Tin tức">Chỉ hiển thị tiêu đề và link về bài gốc của từng nguồn.</Item>
          <Item title="Dữ liệu của bạn">
            Watchlist, cài đặt và sau này danh mục được lưu trên trình duyệt của bạn. Site không có tài khoản và không
            gửi dữ liệu đó đi đâu. Dùng nút xuất/nhập ở header để sao lưu.
          </Item>
          <Item title="Chi phí">Miễn phí toàn bộ, không có gói trả phí.</Item>
          <Item title="Miễn trừ trách nhiệm">
            Thông tin chỉ để tham khảo, không phải khuyến nghị hay tư vấn đầu tư. Dữ liệu có thể trễ hoặc sai.
          </Item>
          <Item title="Công thức">
            Mục này sẽ liệt kê công thức của từng chỉ báo và tín hiệu khi các tính năng đó ra mắt.
          </Item>
        </div>
      </Panel>
    </div>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  );
}
