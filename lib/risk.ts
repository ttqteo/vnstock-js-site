export interface RiskInput {
  /** VND. */
  capital: number;
  /** Percent of capital accepted as loss if the stop hits, e.g. 1 for 1%. */
  riskPct: number;
  /** nghin VND, same unit as the price board. */
  entry: number;
  stop: number;
}

export type RiskResult =
  | {
      ok: true;
      shares: number;
      /** VND. */
      orderValue: number;
      riskAmount: number;
      capitalPct: number;
      target2R: number;
      target3R: number;
    }
  | { ok: false; error: string };

const LOT = 100;

export function positionSize({ capital, riskPct, entry, stop }: RiskInput): RiskResult {
  if (!(capital > 0) || !(riskPct > 0) || !(entry > 0) || !(stop > 0)) {
    return { ok: false, error: "Nhập vốn, % rủi ro, giá vào và giá dừng lỗ lớn hơn 0." };
  }
  if (stop >= entry) return { ok: false, error: "Giá dừng lỗ phải thấp hơn giá vào." };
  const perShareRisk = Math.round((entry - stop) * 1000);
  const byRisk = Math.floor((capital * riskPct) / 100 / perShareRisk / LOT) * LOT;
  const byCapital = Math.floor(capital / (entry * 1000) / LOT) * LOT;
  const shares = Math.min(byRisk, byCapital);
  if (shares <= 0) return { ok: false, error: "Vốn chưa đủ cho một lô 100 cổ phiếu với mức rủi ro này." };
  const r = entry - stop;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return {
    ok: true,
    shares,
    orderValue: shares * entry * 1000,
    riskAmount: shares * perShareRisk,
    capitalPct: round2(((shares * entry * 1000) / capital) * 100),
    target2R: round2(entry + 2 * r),
    target3R: round2(entry + 3 * r),
  };
}
