"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { fmtInt, fmtPrice } from "@/lib/format";
import { positionSize } from "@/lib/risk";

const KEY = "vnstock-starter:risk-calc";

const FIELDS = [
  { name: "capital", label: "Vốn (đồng)" },
  { name: "riskPct", label: "% vốn chấp nhận mất" },
  { name: "entry", label: "Giá vào (nghìn đồng)" },
  { name: "stop", label: "Giá dừng lỗ (nghìn đồng)" },
] as const;

type Values = Record<(typeof FIELDS)[number]["name"], string>;

const DEFAULTS: Values = { capital: "100000000", riskPct: "1", entry: "", stop: "" };

function readStored(): Values {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    if (parsed === null || typeof parsed !== "object") return DEFAULTS;
    const stored = parsed as Partial<Record<keyof Values, unknown>>;
    const pick = (name: keyof Values) => (typeof stored[name] === "string" ? stored[name] : DEFAULTS[name]);
    return { capital: pick("capital"), riskPct: pick("riskPct"), entry: pick("entry"), stop: pick("stop") };
  } catch {
    return DEFAULTS;
  }
}

export function RiskCalculator() {
  const [values, setValues] = useState<Values>(DEFAULTS);

  useEffect(() => {
    setValues(readStored());
  }, []);

  const update = (name: keyof Values, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const filled = FIELDS.every(({ name }) => values[name].trim() !== "");
  const result = positionSize({
    capital: Number(values.capital),
    riskPct: Number(values.riskPct),
    entry: Number(values.entry),
    stop: Number(values.stop),
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map(({ name, label }) => (
          <label key={name} className="flex flex-col gap-1 text-[12px] text-muted-foreground">
            {label}
            <Input
              name={name}
              value={values[name]}
              onChange={(e) => update(name, e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              className="num text-foreground"
            />
          </label>
        ))}
      </div>

      {result.ok ? (
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="text-muted-foreground">Số cổ phiếu</dt>
          <dd data-testid="risk-shares" className="num text-right font-semibold">
            {fmtInt(result.shares)}
          </dd>
          <dt className="text-muted-foreground">Giá trị lệnh</dt>
          <dd className="num text-right">{fmtInt(result.orderValue)} đ</dd>
          <dt className="text-muted-foreground">Chiếm vốn</dt>
          <dd className="num text-right">{result.capitalPct.toFixed(2)}%</dd>
          <dt className="text-muted-foreground">Tiền mất nếu chạm dừng lỗ</dt>
          <dd className="num text-right">{fmtInt(result.riskAmount)} đ</dd>
          <dt className="text-muted-foreground">Mục tiêu 2R</dt>
          <dd className="num text-right">{fmtPrice(result.target2R)}</dd>
          <dt className="text-muted-foreground">Mục tiêu 3R</dt>
          <dd className="num text-right">{fmtPrice(result.target3R)}</dd>
        </dl>
      ) : filled ? (
        <p data-testid="risk-error" className="text-[13px] text-down">
          {result.error}
        </p>
      ) : (
        <p className="text-[13px] text-muted-foreground">Nhập giá vào và giá dừng lỗ để tính số cổ phiếu.</p>
      )}

      <p className="text-[12px] text-muted-foreground">Lô 100 cổ phiếu. Chưa tính phí giao dịch và thuế.</p>
    </div>
  );
}
