import { describe, expect, it } from "vitest";
import { filterBySource, sourcesOf } from "../news-filter";

const items = [
  { id: "1", source: "CafeF", title: "a" },
  { id: "2", source: "Vietstock", title: "b" },
  { id: "3", source: "CafeF", title: "c" },
] as any[];

describe("news filter", () => {
  it("lists sources by how often they appear", () => {
    expect(sourcesOf(items)).toEqual(["CafeF", "Vietstock"]);
  });

  it("keeps everything without a source filter", () => {
    expect(filterBySource(items, undefined)).toHaveLength(3);
  });

  it("filters by source, case-insensitive", () => {
    expect(filterBySource(items, "cafef").map((i) => i.id)).toEqual(["1", "3"]);
  });
});
