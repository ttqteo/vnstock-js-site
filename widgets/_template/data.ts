// Bước 1: import dữ liệu từ lib/board.ts. Mọi lời gọi mạng của app đều nằm
// ở đó, đã cache sẵn. Cần nguồn dữ liệu mới? Thêm một hàm cached vào
// lib/board.ts trước, rồi mới import về đây.
import { getBoard, type Exchange } from "@/lib/board";

// Bước 2: hàm async lấy và biến đổi dữ liệu, trả về ĐÚNG thứ index.tsx cần.
// File này không import React, không JSX.
export interface ExampleRow {
  symbol: string;
  valueTy: number;
}

export async function getExampleData(exchange: Exchange): Promise<ExampleRow[]> {
  const board = await getBoard(exchange);
  return [...board]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)
    .map((item) => ({ symbol: item.symbol, valueTy: item.totalValue / 1000 }));
}
