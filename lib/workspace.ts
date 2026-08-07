/** Which workspace pane is open. A cookie, not localStorage, because the
 * server renders that pane on first paint and only cookies reach the server.
 * The client writes it with document.cookie: no server action, so switching
 * tabs never re-renders the page. */
export const TAB_COOKIE = "vnstock-starter-tab";
export const TAB_MAX_AGE = 60 * 60 * 24 * 365;

export const WORKSPACE_TABS = ["thi-truong", "bieu-do", "bang-gia"] as const;
export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export function normalizeTab(value: string | undefined): WorkspaceTab {
  return WORKSPACE_TABS.some((tab) => tab === value) ? (value as WorkspaceTab) : "thi-truong";
}
