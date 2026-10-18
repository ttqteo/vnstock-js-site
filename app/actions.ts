"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlist, sanitize, WATCHLIST_COOKIE } from "@/lib/watchlist";

/** Header search; invalid input just goes home. */
export async function goToStock(formData: FormData) {
  const q = String(formData.get("q") ?? "").trim().toUpperCase();
  if (/^[A-Z0-9]{3,10}$/.test(q)) redirect(`/ma/${q}`);
  redirect("/");
}

/** Setting the cookie in a server action re-renders the page in the same
 * round trip, so no client state is needed. */
async function setWatchlist(symbols: string[]) {
  const jar = await cookies();
  jar.set(WATCHLIST_COOKIE, sanitize(symbols).join(","), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function addWatchlistSymbol(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,10}$/.test(symbol)) return;
  const list = await getWatchlist();
  if (list.indexOf(symbol) === -1) await setWatchlist([...list, symbol]);
}

export async function removeWatchlistSymbol(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "").trim().toUpperCase();
  const list = await getWatchlist();
  await setWatchlist(list.filter((s) => s !== symbol));
}
