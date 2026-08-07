import "server-only";
import { cookies } from "next/headers";

/** The viewer's watchlist: a cookie, not localStorage, because server
 * components render the list and only cookies reach the server. Format is
 * a plain comma-joined string so nothing needs escaping. */
export const WATCHLIST_COOKIE = "vnstock-starter-watchlist";

/** What first-time visitors see. Changing this is prompts/01. */
export const DEFAULT_WATCHLIST = ["VCB", "FPT", "HPG", "MWG", "SSI"];

const MAX_SYMBOLS = 30;
const VALID = /^[A-Z0-9]{3,10}$/;

export async function getWatchlist(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(WATCHLIST_COOKIE)?.value;
  // No cookie -> default list. An empty cookie is a deliberate empty list.
  if (raw === undefined) return DEFAULT_WATCHLIST;
  return sanitize(raw.split(","));
}

export function sanitize(symbols: string[]): string[] {
  const out: string[] = [];
  for (const s of symbols) {
    const symbol = s.trim().toUpperCase();
    if (VALID.test(symbol) && out.indexOf(symbol) === -1) out.push(symbol);
    if (out.length >= MAX_SYMBOLS) break;
  }
  return out;
}
