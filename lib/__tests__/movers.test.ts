import { describe, expect, it } from "vitest";
import { changePct, topMovers } from "../movers";

const row = (symbol: string, price: number, referencePrice: number, totalVolume = 1000) =>
  ({ symbol, price, referencePrice, totalVolume }) as any;

describe("movers", () => {
  it("computes percent change against the reference price", () => {
    expect(changePct(row("A", 11, 10))).toBeCloseTo(10);
  });

  it("treats a symbol with no match yet as unchanged", () => {
    expect(changePct(row("A", 0, 10))).toBe(0);
  });

  it("returns the biggest gainers first", () => {
    const rows = [row("A", 10.5, 10), row("B", 11, 10), row("C", 9, 10)];
    expect(topMovers(rows, "up", 2).map((r) => r.symbol)).toEqual(["B", "A"]);
  });

  it("returns the biggest losers first and skips untraded rows", () => {
    const rows = [row("A", 9.5, 10), row("B", 9, 10), row("C", 9.8, 10, 0)];
    expect(topMovers(rows, "down", 5).map((r) => r.symbol)).toEqual(["B", "A"]);
  });
});
