import { getBoard, type Exchange } from "@/lib/board";
import { priceState } from "@/lib/colors";
import { trieuToTy } from "@/lib/format";

export interface MoneyFlowData {
  upTy: number;
  downTy: number;
  unchangedTy: number;
  totalTy: number;
}

/** Turnover grouped by direction, computed from raw board rows. Ceiling
 * counts as up, floor as down; board money is trieu VND. */
export async function getMoneyFlow(exchange: Exchange): Promise<MoneyFlowData> {
  const board = await getBoard(exchange);

  let up = 0;
  let down = 0;
  let unchanged = 0;
  for (const item of board) {
    if (item.price <= 0 || item.totalValue <= 0) continue;
    const state = priceState(item.price, item.referencePrice, item.ceilingPrice, item.floorPrice);
    if (state === "up" || state === "ceil") up += item.totalValue;
    else if (state === "down" || state === "floor") down += item.totalValue;
    else unchanged += item.totalValue;
  }

  return {
    upTy: trieuToTy(up),
    downTy: trieuToTy(down),
    unchangedTy: trieuToTy(unchanged),
    totalTy: trieuToTy(up + down + unchanged),
  };
}
