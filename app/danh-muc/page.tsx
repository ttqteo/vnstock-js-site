import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { RiskCalculator } from "@/components/risk-calculator";

export const metadata: Metadata = { title: "Danh mục · vnstock-js" };

export default function PortfolioPage() {
  return (
    <div className="grid gap-px bg-border md:grid-cols-2">
      <Panel title="Máy tính rủi ro">
        <RiskCalculator />
      </Panel>
      <Panel title="Danh mục">
        <p className="text-[13px] text-muted-foreground">
          Quản lý danh mục nhiều tài khoản và nhật ký giao dịch, lưu ngay trên trình duyệt, sẽ có ở bản sau.
        </p>
      </Panel>
    </div>
  );
}
