import { describe, expect, it } from "vitest";
import { positionSize } from "../risk";

describe("positionSize", () => {
  it("sizes so the stop loses the chosen share of capital, in lots of 100", () => {
    const r = positionSize({ capital: 100_000_000, riskPct: 1, entry: 50, stop: 48 });
    expect(r).toMatchObject({ ok: true, shares: 500, orderValue: 25_000_000, riskAmount: 1_000_000 });
    if (r.ok) {
      expect(r.target2R).toBe(54);
      expect(r.target3R).toBe(56);
    }
  });

  it("rounds down to a whole lot", () => {
    const r = positionSize({ capital: 100_000_000, riskPct: 1, entry: 50, stop: 47 });
    expect(r.ok && r.shares).toBe(300);
  });

  it("never spends more than the capital", () => {
    const r = positionSize({ capital: 10_000_000, riskPct: 5, entry: 50, stop: 49.9 });
    expect(r.ok && r.shares).toBe(200);
    expect(r.ok && r.orderValue).toBeLessThanOrEqual(10_000_000);
  });

  it("rejects a stop at or above entry", () => {
    expect(positionSize({ capital: 1e8, riskPct: 1, entry: 50, stop: 50 })).toEqual({
      ok: false,
      error: "Giá dừng lỗ phải thấp hơn giá vào.",
    });
  });

  it("rejects non-positive inputs", () => {
    expect(positionSize({ capital: 0, riskPct: 1, entry: 50, stop: 48 }).ok).toBe(false);
    expect(positionSize({ capital: 1e8, riskPct: 0, entry: 50, stop: 48 }).ok).toBe(false);
  });
});
