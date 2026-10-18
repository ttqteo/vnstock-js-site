type WithSource = { source: string };

export function sourcesOf<T extends WithSource>(items: T[]): string[] {
  const count = new Map<string, number>();
  for (const i of items) count.set(i.source, (count.get(i.source) || 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

export function filterBySource<T extends WithSource>(items: T[], source: string | undefined): T[] {
  if (!source) return items;
  const s = source.toLowerCase();
  return items.filter((i) => i.source.toLowerCase() === s);
}
