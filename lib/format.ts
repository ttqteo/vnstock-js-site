/**
 * Units cheat sheet:
 * - stock prices: nghin VND (24.20) · indices: points
 * - PriceBoardItem.totalValue: TRIEU VND, divide by 1000 for ty
 * - market.* money fields: already ty VND
 */

export function fmtPrice(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** +1.26% / -0.63% / 0.00% */
export function fmtPct(n: number | null | undefined): string {
  if (n == null) return "–";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/** Signed absolute change: +0.30 / -1.20 */
export function fmtChange(n: number | null | undefined): string {
  if (n == null) return "–";
  const sign = n > 0 ? "+" : "";
  return `${sign}${fmtPrice(n)}`;
}

/** 123,456,789 -> 123.46M; 12,300 -> 12.3K */
export function fmtVolume(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return fmtInt(n);
}

/** Money already in ty VND -> "8,720.4 tỷ" */
export function fmtTy(ty: number): string {
  const abs = Math.abs(ty);
  const digits = abs >= 1000 ? 1 : abs >= 10 ? 1 : 2;
  return `${ty.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} tỷ`;
}

/** PriceBoardItem.totalValue is in trieu VND. */
export function trieuToTy(trieu: number): number {
  return trieu / 1000;
}

/** "5 phút trước" / "2 tiếng trước" / "07/08". Empty on unparsable input. */
export function fmtTimeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const minutes = Math.round((Date.now() - t) / 60000);
  if (minutes < 1) return "vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} tiếng trước`;
  const d = new Date(t);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
