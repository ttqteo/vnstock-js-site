import "server-only";
import vnstock from "vnstock-js";

/** SDK import point. "server-only" fails the build if client code ever
 * imports it. Widgets and pages go through lib/board.ts, not this. */
export { market, news, sma } from "vnstock-js";
export default vnstock;
