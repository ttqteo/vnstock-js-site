/** Bảng điện palette. Must match :root in app/globals.css; this file
 * exists so canvas code (no CSS access) reads the same hex values. */
export const COLORS = {
  up: "#22c55e",
  down: "#ef4444",
  ref: "#eab308",
  ceil: "#d946ef",
  floor: "#22d3ee",
  muted: "#7a8699",
} as const;

export type PriceState = "up" | "down" | "ref" | "ceil" | "floor";

/** Classify a traded price against reference / ceiling / floor. */
export function priceState(
  price: number,
  ref: number,
  ceil?: number,
  floor?: number
): PriceState {
  if (ceil !== undefined && ceil > 0 && price >= ceil) return "ceil";
  if (floor !== undefined && floor > 0 && price <= floor) return "floor";
  if (price > ref) return "up";
  if (price < ref) return "down";
  return "ref";
}

/** Classify a change (or percent change) when there is no ceiling/floor,
 * e.g. for indices. */
export function changeState(change: number | null | undefined): PriceState {
  if (change == null || change === 0) return "ref";
  return change > 0 ? "up" : "down";
}

const TEXT: Record<PriceState, string> = {
  up: "text-up",
  down: "text-down",
  ref: "text-ref",
  ceil: "text-ceil",
  floor: "text-floor",
};

export function textClass(state: PriceState): string {
  return TEXT[state];
}
