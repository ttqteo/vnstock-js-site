/** Squarified treemap (Bruls/Huizing/van Wijk): weighted items to x/y/w/h
 * rectangles in a 100x100 box, tiles kept close to square. */
export interface TreemapItem {
  key: string;
  value: number;
}

export interface TreemapRect extends TreemapItem {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function squarify(items: TreemapItem[], width = 100, height = 100): TreemapRect[] {
  const sorted = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) return [];

  // Scale values so they sum to the box area.
  const scaled = sorted.map((i) => ({ ...i, value: (i.value / total) * width * height }));

  const rects: TreemapRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let row: typeof scaled = [];

  const worst = (r: typeof scaled, side: number): number => {
    const sum = r.reduce((s, i) => s + i.value, 0);
    const max = Math.max(...r.map((i) => i.value));
    const min = Math.min(...r.map((i) => i.value));
    const s2 = sum * sum;
    return Math.max((side * side * max) / s2, s2 / (side * side * min));
  };

  const layoutRow = (r: typeof scaled) => {
    const sum = r.reduce((s, i) => s + i.value, 0);
    const horizontal = w >= h; // lay the row along the shorter side
    const thickness = horizontal ? sum / h : sum / w;
    let offset = 0;
    for (const item of r) {
      const length = item.value / thickness;
      rects.push(
        horizontal
          ? { ...item, x, y: y + offset, w: thickness, h: length }
          : { ...item, x: x + offset, y, w: length, h: thickness }
      );
      offset += length;
    }
    if (horizontal) {
      x += thickness;
      w -= thickness;
    } else {
      y += thickness;
      h -= thickness;
    }
  };

  for (const item of scaled) {
    const side = Math.min(w, h);
    if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) {
      row.push(item);
    } else {
      layoutRow(row);
      row = [item];
    }
  }
  if (row.length > 0) layoutRow(row);

  return rects;
}
