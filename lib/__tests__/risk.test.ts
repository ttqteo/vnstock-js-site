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

  it("keeps the last lot when the risk budget divides exactly but floats land just below", () => {
    const r = positionSize({ capital: 1e8, riskPct: 2.3, entry: 20.9, stop: 19.9 });
    expect(r.ok && r.shares).toBe(2300);
  });

  it("never drops a lot and never exceeds the risk budget across a sweep", () => {
    const pairs = [
      [20.9, 19.9],
      [50, 48],
      [12.35, 11.85],
      [100, 95],
    ];
    let sized = 0;
    for (const capital of [5e7, 1e8, 2.5e8, 1e9]) {
      for (let i = 1; i <= 100; i++) {
        const riskPct = i / 10;
        for (const [entry, stop] of pairs) {
          const budget = (capital * riskPct) / 100;
          const perShareRisk = Math.round((entry - stop) * 1000);
          const r = positionSize({ capital, riskPct, entry, stop });
          const shares = r.ok ? r.shares : 0;
          if (r.ok) {
            sized++;
            expect(r.riskAmount).toBeLessThanOrEqual(budget + 1e-6);
            expect(r.orderValue).toBeLessThanOrEqual(capital + 1e-6);
          }
          const nextLot = shares + 100;
          const overRisk = nextLot * perShareRisk > budget + 1e-6;
          const overCapital = nextLot * entry * 1000 > capital + 1e-6;
          expect(
            overRisk || overCapital,
            `capital=${capital} riskPct=${riskPct} entry=${entry} stop=${stop} shares=${shares}`,
          ).toBe(true);
        }
      }
    }
    expect(sized).toBeGreaterThan(1000);
  });
});
