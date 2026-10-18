/** Listing groups the board can show instead of a whole exchange. */
export const BOARD_GROUPS = ["VN30", "VN100", "HNX30"] as const;
export type BoardGroup = (typeof BOARD_GROUPS)[number];

export function normalizeGroup(value: string | undefined): BoardGroup | undefined {
  const v = value?.toUpperCase();
  return BOARD_GROUPS.find((g) => g === v);
}

export function industriesOf(symbols: string[], industryOf: Record<string, string>): string[] {
  const set = new Set<string>();
  for (const s of symbols) if (industryOf[s]) set.add(industryOf[s]);
  return [...set].sort((a, b) => a.localeCompare(b, "vi"));
}

export function byIndustry<T extends { symbol: string }>(
  items: T[],
  industryOf: Record<string, string>,
  industry: string | undefined
): T[] {
  if (!industry) return items;
  return items.filter((i) => industryOf[i.symbol] === industry);
}
