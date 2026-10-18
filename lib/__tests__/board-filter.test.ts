import { describe, expect, it } from "vitest";
import { byIndustry, industriesOf, normalizeGroup } from "../board-filter";

const industryOf = { FPT: "Công nghệ", VCB: "Ngân hàng", ACB: "Ngân hàng" };

describe("board filter", () => {
  it("accepts known groups case-insensitively", () => {
    expect(normalizeGroup("vn30")).toBe("VN30");
    expect(normalizeGroup("HNX30")).toBe("HNX30");
  });

  it("rejects unknown or missing groups", () => {
    expect(normalizeGroup("VN999")).toBeUndefined();
    expect(normalizeGroup(undefined)).toBeUndefined();
  });

  it("lists the industries present, sorted", () => {
    expect(industriesOf(["VCB", "FPT", "ACB", "XYZ"], industryOf)).toEqual(["Công nghệ", "Ngân hàng"]);
  });

  it("filters rows by industry, keeps all without one", () => {
    const rows = [{ symbol: "FPT" }, { symbol: "VCB" }, { symbol: "ACB" }];
    expect(byIndustry(rows, industryOf, "Ngân hàng").map((r) => r.symbol)).toEqual(["VCB", "ACB"]);
    expect(byIndustry(rows, industryOf, undefined)).toHaveLength(3);
  });
});
