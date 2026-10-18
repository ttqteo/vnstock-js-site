import { describe, expect, it } from "vitest";
import { activeNav, NAV } from "../nav";

describe("activeNav", () => {
  it("matches the home route only exactly", () => {
    expect(activeNav("/")).toBe("/");
    expect(activeNav("/bang-gia")).toBe("/bang-gia");
  });

  it("matches nested paths to their section", () => {
    expect(activeNav("/tin-tuc")).toBe("/tin-tuc");
    expect(activeNav("/danh-muc/abc")).toBe("/danh-muc");
  });

  it("returns null for pages outside the nav, like a stock page", () => {
    expect(activeNav("/ma/FPT")).toBeNull();
    expect(activeNav("/nguon-du-lieu")).toBeNull();
  });

  it("lists the sections in display order", () => {
    expect(NAV.map((n) => n.label)).toEqual(["Thị trường", "Bảng giá", "Biểu đồ", "Danh mục", "Tin tức"]);
  });
});
