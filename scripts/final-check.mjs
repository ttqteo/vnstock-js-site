// Drives the production build in chromium: `npm run build && node scripts/final-check.mjs`.
// Writes one screenshot per step and OUT/shots.json. Exit 0 all steps passed,
// 1 a step failed or the server never came up, 3 playwright or chromium unavailable.
// Market data can be empty outside trading hours, so steps check structure, not numbers.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3107;
const BASE = `http://localhost:${PORT}`;
const OUT = process.env.ARC_FINAL_OUT || "final-out";
const VERSION = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

const DESKTOP = { width: 1366, height: 900 };
const MOBILE = { width: 390, height: 844 };
const TIMEOUT = 30_000;
const NAV = 'nav[aria-label="Mục chính"]';
const ERROR_TEXT = "Không tải được dữ liệu";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (e) {
  console.log(`playwright is not available: ${e.message}`);
  process.exit(3);
}

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.log(`cannot open chromium: ${String(e.message).split("\n")[0]}`);
  process.exit(3);
}

mkdirSync(OUT, { recursive: true });

const server = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: ROOT,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
  windowsHide: true,
});
let serverLog = "";
let serverExit = null;
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => (serverLog = (serverLog + chunk).slice(-2000)));
}
server.on("exit", (code) => (serverExit = code ?? -1));

function stopServer() {
  if (!server.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {}
  }
}
process.on("exit", stopServer);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => process.exit(130));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (serverExit !== null) throw new Error(`next start exited with code ${serverExit}: ${serverLog.trim()}`);
    try {
      await fetch(`${BASE}/`, { signal: AbortSignal.timeout(30_000) });
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error(`next start did not answer on :${PORT} within 90s: ${serverLog.trim()}`);
}

/** Error text without the ANSI colour codes Playwright puts in its call logs. */
const plain = (e) => String(e instanceof Error ? e.message : e).replace(/\u001b\[[\d;]*m/g, "");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Polls `check` (truthy = done). A check that throws fails the step at once. */
async function until(check, message, timeout = TIMEOUT) {
  const deadline = Date.now() + timeout;
  for (;;) {
    try {
      if (await check()) return;
    } catch (e) {
      if (!String(e.message).includes("Execution context was destroyed")) throw e;
    }
    if (Date.now() > deadline) throw new Error(typeof message === "function" ? message() : message);
    await sleep(150);
  }
}

/** React stamps __reactProps$ on a node once it is hydrated; clicks and typing before that are lost. */
const HYDRATED = (selector) => {
  const el = document.querySelector(selector);
  return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps$"));
};

async function settle(page, probe = '[data-testid="rail-tab"]') {
  await page
    .waitForFunction(HYDRATED, probe, { timeout: 20_000 })
    .catch(() => page.waitForLoadState("networkidle").catch(() => {}));
  // Mount effects (restoring tab, rail width, form values) run just after hydration.
  await page.waitForTimeout(250);
}

async function go(page, url, probe) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await settle(page, probe);
}

const mainText = (page) => page.locator("main").innerText();
const mainHas = (page, text) => until(async () => (await mainText(page)).includes(text), `main has no "${text}"`);
const onUrl = (page, test, what) => until(() => test(new URL(page.url())), () => `${what}, url is ${page.url()}`);
const isPath = (page, pathname) => onUrl(page, (u) => u.pathname === pathname, `url is not ${pathname}`);

const hasChart = (page) =>
  until(
    () => page.evaluate(() => [...document.querySelectorAll("canvas")].some((c) => c.getBoundingClientRect().height > 100)),
    "no canvas taller than 100px"
  );

const boardLoaded = (page) =>
  until(
    async () => (await page.locator("main table").count()) > 0 || (await mainText(page)).includes(ERROR_TEXT),
    "board neither rendered a table nor an error"
  );

const activeNav = (page) => page.locator(`${NAV} a[aria-current="page"]`);

const activeTab = (page, label) => page.locator('main a[aria-current="page"]').filter({ hasText: new RegExp(`^${label}$`) });

/** The visible pane of the right rail, summarised. */
const railPane = (page) =>
  page.evaluate(() => {
    const list = document.querySelector('[data-rail] [role="tablist"]');
    const pane = [...list.parentElement.children].find((el) => el !== list && getComputedStyle(el).display !== "none");
    if (!pane) return null;
    return {
      stockLinks: pane.querySelectorAll('a[href^="/ma/"]').length,
      newsRail: !!pane.querySelector('[data-testid="news-rail"]'),
      text: pane.innerText,
    };
  });

const noSideOverflow = async (page, where) => {
  const m = await page.evaluate(() => {
    const shell = document.querySelector("[data-shell]");
    return {
      doc: document.documentElement.scrollWidth <= window.innerWidth,
      shell: shell.scrollWidth <= shell.clientWidth,
    };
  });
  assert(m.doc, `${where}: the document scrolls sideways`);
  assert(m.shell, `${where}: [data-shell] scrolls sideways`);
};

const steps = [];
const files = [];

async function step(name, run, { viewport = DESKTOP, seen = true } = {}) {
  const context = await browser.newContext({ viewport });
  context.setDefaultTimeout(TIMEOUT);
  context.setDefaultNavigationTimeout(60_000);
  // Only the whats-new step lets the changelog card pop up; it would cover the other pages.
  if (seen) {
    await context.addInitScript((version) => {
      try {
        localStorage.setItem("vnstock-starter:seen-version", version);
      } catch {}
    }, VERSION);
  }
  const page = await context.newPage();
  const result = { step: name, state: "pass" };
  try {
    const detail = await run(page);
    if (detail) result.detail = detail;
  } catch (e) {
    result.state = "fail";
    result.detail = plain(e).slice(0, 1000);
  }
  try {
    await page.waitForTimeout(300);
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  } catch {}
  await context.close().catch(() => {});
  steps.push(result);
  console.log(`${result.state === "pass" ? "PASS" : "FAIL"} ${name}${result.detail ? ` - ${result.detail}` : ""}`);
}

async function runSteps() {
  await step("nav-active", async (page) => {
    const sections = [
      ["/", "Thị trường"],
      ["/bang-gia", "Bảng giá"],
      ["/bieu-do", "Biểu đồ"],
      ["/danh-muc", "Danh mục"],
      ["/tin-tuc", "Tin tức"],
    ];
    for (const [url, label] of sections) {
      await go(page, url);
      const active = activeNav(page);
      const count = await active.count();
      assert(count === 1, `${url}: ${count} active nav links, expected 1`);
      const text = (await active.innerText()).trim();
      assert(text === label, `${url}: active nav link is "${text}", expected "${label}"`);
    }
  });

  await step("stock-page", async (page) => {
    await go(page, "/ma/FPT");
    assert((await activeNav(page).count()) === 0, "a nav link is active on /ma/FPT");
    const title = await page.title();
    assert(title.includes("FPT"), `title is "${title}"`);
    assert((await page.locator("main h1").first().innerText()).includes("FPT"), "main h1 has no FPT");
    await hasChart(page);

    await go(page, "/");
    const link = page.locator('[data-rail] a[href^="/ma/"]').first();
    assert((await link.count()) > 0, "the rail has no /ma/ link");
    const code = (await link.getAttribute("href")).split("/").pop();
    await link.click();
    await isPath(page, `/ma/${code}`);
    await until(async () => (await page.locator("main h1").first().innerText()).trim() === code, `main h1 is not ${code}`);
  });

  await step("index-strip", async (page) => {
    await go(page, "/");
    const cards = page.locator('[data-testid="index-strip"] a');
    const count = await cards.count();
    assert(count === 4, `index strip has ${count} cards, expected 4`);
    await cards.filter({ hasText: "VN30" }).click();
    await onUrl(
      page,
      (u) => u.pathname === "/bieu-do" && u.searchParams.get("ma") === "VN30",
      "url is not /bieu-do?ma=VN30"
    );
    await hasChart(page);
  });

  await step("chart-symbol", async (page) => {
    await go(page, "/bieu-do");
    await page.locator('main input[name="ma"]').fill("fpt");
    await page.getByRole("button", { name: "Xem", exact: true }).click();
    await onUrl(
      page,
      (u) => u.pathname === "/bieu-do" && ["fpt", "FPT"].includes(u.searchParams.get("ma") ?? ""),
      "url is not /bieu-do?ma=fpt"
    );
    await hasChart(page);

    await go(page, "/bieu-do?ma=XXXXZ");
    await mainHas(page, ERROR_TEXT);
    assert((await page.locator(NAV).count()) > 0, "the nav is gone on the error page");
  });

  await step("exchange", async (page) => {
    await go(page, "/bang-gia");
    await page.locator("main").getByRole("link", { name: "HNX", exact: true }).click();
    await onUrl(page, (u) => u.pathname + u.search === "/bang-gia?ex=HNX", "url is not /bang-gia?ex=HNX");
    await mainHas(page, "Bảng giá HNX");
    await until(async () => (await activeTab(page, "HNX").count()) === 1, "HNX tab is not current");

    await go(page, "/?ex=UPCOM");
    assert((await activeTab(page, "UPCOM").count()) === 1, "UPCOM tab is not current on /?ex=UPCOM");
  });

  await step("rail-tabs", async (page) => {
    await go(page, "/");
    const tab = (label) => page.locator('[data-testid="rail-tab"]', { hasText: label });
    const selected = (label) => until(async () => (await tab(label).getAttribute("aria-selected")) === "true", `${label} not selected`);
    const panes = [
      ["Tăng mạnh", (s) => s.stockLinks > 0 || s.text.includes("Chưa có mã nào")],
      ["Giảm mạnh", (s) => s.stockLinks > 0 || s.text.includes("Chưa có mã nào")],
      ["Tin tức", (s) => s.newsRail || s.text.includes("Chưa có tin hôm nay.")],
    ];
    for (const [label, ready] of panes) {
      await tab(label).click();
      await selected(label);
      await until(
        async () => {
          const pane = await railPane(page);
          assert(pane, `${label}: no visible rail pane`);
          assert(!pane.text.includes("Không tải được"), `${label}: pane shows an error`);
          return ready(pane);
        },
        `${label}: pane has neither content nor its empty message`
      );
    }
    await tab("Tăng mạnh").click();
    await selected("Tăng mạnh");
    await page.reload();
    await settle(page);
    await selected("Tăng mạnh");
  });

  await step("rail-collapse", async (page) => {
    await go(page, "/");
    const rail = page.locator("[data-rail]");
    const toggle = page.locator('[data-testid="rail-toggle"]');
    assert(await rail.isVisible(), "the rail is hidden before the toggle");
    await toggle.click();
    await until(async () => !(await rail.isVisible()), "the rail is still visible after the toggle");
    await page.reload();
    await settle(page);
    assert(!(await rail.isVisible()), "the rail is visible again after reload");
    assert(
      await page.evaluate(() => document.documentElement.classList.contains("rail-collapsed")),
      "html has no rail-collapsed class after reload"
    );
    await toggle.click();
    await until(() => rail.isVisible(), "the rail did not come back");
  });

  await step("rail-resize", async (page) => {
    await go(page, "/");
    const rail = page.locator("[data-rail]");
    const width = async () => (await rail.boundingBox()).width;
    const before = await width();
    const box = await page.locator('[data-testid="column-handle"]').boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 80, y, { steps: 10 });
    await page.mouse.up();
    const after = await width();
    assert(after - before >= 40, `rail went from ${before}px to ${after}px, expected at least 40px wider`);
    await page.reload();
    await settle(page);
    const reloaded = await width();
    assert(Math.abs(reloaded - 300) > 40, `rail is ${reloaded}px after reload, still near the 300px default`);
  });

  await step("redirects", async (page) => {
    // A redirect() under app/loading.tsx is a streamed 200 plus a client redirect, so wait for the path.
    await page.goto(`${BASE}/stock/FPT`, { waitUntil: "domcontentloaded" });
    await isPath(page, "/ma/FPT");
    await page.goto(`${BASE}/?tab=bang-gia`, { waitUntil: "domcontentloaded" });
    await isPath(page, "/bang-gia");
  });

  await step("search", async (page) => {
    await go(page, "/");
    const input = page.locator('body > header input[name="q"]');
    await input.fill("fpt");
    await input.press("Enter");
    await isPath(page, "/ma/FPT");
  });

  await step("news", async (page) => {
    const listed = async () =>
      (await page.locator('[data-testid="news-list"]').count()) > 0 || (await mainText(page)).includes("Không có tin phù hợp.");
    await go(page, "/tin-tuc");
    await until(listed, "/tin-tuc has neither the news list nor its empty message");

    await page.locator('main input[name="ma"]').fill("FPT");
    await page.locator("main").getByRole("button", { name: "Lọc", exact: true }).click();
    await onUrl(page, (u) => u.searchParams.get("ma") === "FPT", "url has no ma=FPT");
    await until(listed, "the FPT news page has neither the list nor its empty message");

    const tabs = page.locator("main nav a");
    if ((await tabs.count()) < 2) return "không có nguồn";
    const second = tabs.nth(1);
    const label = (await second.innerText()).trim();
    await second.click();
    await onUrl(page, (u) => !!u.searchParams.get("nguon") && u.searchParams.get("ma") === "FPT", "url lost ma=FPT or has no nguon=");
    await until(
      async () => (await page.locator('main nav a[aria-current="page"]').allInnerTexts()).map((t) => t.trim()).includes(label),
      `source tab "${label}" is not current`
    );
  });

  await step("risk-calc", async (page) => {
    const field = (name) => page.locator(`input[name="${name}"]`);
    const shares = page.locator('[data-testid="risk-shares"]');
    const sharesShow500 = async () => (await shares.count()) > 0 && (await shares.first().innerText()).includes("500");
    const values = { capital: "100000000", riskPct: "1", entry: "50", stop: "48" };

    await go(page, "/danh-muc", 'input[name="capital"]');
    for (const [name, value] of Object.entries(values)) await field(name).fill(value);
    await until(sharesShow500, "risk-shares does not show 500");

    await page.reload();
    await settle(page, 'input[name="capital"]');
    for (const [name, value] of Object.entries(values)) {
      await until(async () => (await field(name).inputValue()) === value, `${name} did not keep ${value} after reload`);
    }
    await until(sharesShow500, "risk-shares does not show 500 after reload");

    await field("stop").fill("50");
    await until(
      async () => (await page.locator('[data-testid="risk-error"]').allInnerTexts()).join(" ").includes("Giá dừng lỗ phải thấp hơn giá vào."),
      "risk-error does not say the stop must be lower than the entry"
    );
    assert((await shares.count()) === 0, "risk-shares is still shown next to the error");
  });

  await step("data-source", async (page) => {
    await go(page, "/nguon-du-lieu");
    const heading = (await page.locator("h1").first().innerText()).trim();
    assert(heading === "Nguồn dữ liệu và phương pháp", `h1 is "${heading}"`);

    await go(page, "/");
    await page.locator('footer a[href="/nguon-du-lieu"]').click();
    await isPath(page, "/nguon-du-lieu");
    await until(
      async () => (await page.locator("h1").first().innerText()).trim() === "Nguồn dữ liệu và phương pháp",
      "the footer link did not reach the data source page"
    );
  });

  await step("board-group", async (page) => {
    await go(page, "/bang-gia");
    await page.locator("main").getByRole("link", { name: "VN30", exact: true }).click();
    await onUrl(page, (u) => u.pathname === "/bang-gia" && u.searchParams.get("nhom") === "VN30", "url has no nhom=VN30");
    await mainHas(page, "Bảng giá VN30");
    await until(async () => (await activeTab(page, "VN30").count()) === 1, "VN30 tab is not current");
    for (const exchange of ["HSX", "HNX", "UPCOM"]) {
      assert((await activeTab(page, exchange).count()) === 0, `${exchange} tab is current next to the VN30 group`);
    }
    await boardLoaded(page);
    const rows = await page.locator("main tbody tr").count();
    assert(rows >= 0 && rows <= 30, `VN30 board has ${rows} rows, expected 0 to 30`);

    const select = page.locator('main select[name="nganh"]');
    await select.waitFor();
    assert((await select.locator("option").count()) >= 2, "the industry select has no industry option");
    await select.selectOption({ index: 1 });
    await page.locator("main").getByRole("button", { name: "Lọc", exact: true }).click();
    await onUrl(
      page,
      (u) => !!u.searchParams.get("nganh") && u.searchParams.get("nhom") === "VN30",
      "url lost nhom=VN30 or has no nganh="
    );
    await boardLoaded(page);
    assert(!(await mainText(page)).includes(ERROR_TEXT), "the filtered board shows an error");
  });

  await step(
    "mobile-menu",
    async (page) => {
      await go(page, "/");
      assert(!(await page.locator(`body > header ${NAV}`).isVisible()), "the header nav is visible at 390px");
      assert(await page.locator('input[name="q"]').isVisible(), "the search box is hidden at 390px");
      assert(!(await page.locator('a[title="GitHub"]').isVisible()), "the GitHub link is visible at 390px");
      const stripScrolls = await page.evaluate(() => {
        const strip = document.querySelector('[data-testid="index-strip"]');
        return !!strip && strip.scrollWidth > strip.clientWidth;
      });
      assert(stripScrolls, "the index strip does not scroll sideways");
      await noSideOverflow(page, "/");

      await page.locator('[data-testid="mobile-menu-button"]').click();
      const menu = page.locator('[data-testid="mobile-menu"]');
      await menu.waitFor({ state: "visible" });
      const header = await page.locator("body > header").boundingBox();
      const menuBox = await menu.boundingBox();
      const gap = Math.abs(menuBox.y - (header.y + header.height));
      assert(gap <= 1, `the menu starts ${gap}px away from the header bottom`);

      await menu.getByRole("link", { name: "Bảng giá", exact: true }).click();
      await isPath(page, "/bang-gia");
      await until(async () => (await menu.count()) === 0, "the menu stays open after navigating");
      await boardLoaded(page);
      await noSideOverflow(page, "/bang-gia");

      await go(page, "/");
      const rail = await page.locator("[data-rail]").boundingBox();
      const main = await page.locator("main").boundingBox();
      assert(rail.y > main.y, `rail y ${rail.y} is not below main y ${main.y}`);

      await go(page, "/bieu-do");
      await hasChart(page);
    },
    { viewport: MOBILE }
  );

  await step("light-theme", async (page) => {
    await go(page, "/");
    const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const dark = await background();
    await page.evaluate(() => localStorage.setItem("vnstock-starter:theme", "light"));
    await page.reload();
    await settle(page);
    assert(await page.evaluate(() => document.documentElement.classList.contains("light")), "html has no light class");
    const light = await background();
    assert(light !== dark, `body background is ${dark} in both themes`);
  });

  await step(
    "whats-new",
    async (page) => {
      const card = page.locator("aside:not([data-rail])", { hasText: "Changelog" });
      const badge = page.locator("body > header button", { hasText: /^v1\.1\.0$/ });
      await go(page, "/");
      assert((await badge.count()) === 1, "no v1.1.0 badge in the header");
      await card.waitFor({ state: "visible" });
      const text = await card.innerText();
      assert(text.includes("v1.1.0"), "the card has no v1.1.0 entry");
      const items = await card.locator("li").count();
      assert(items === 8, `the card lists ${items} items, expected 8`);

      await card.getByRole("button", { name: "Đã hiểu" }).click();
      await until(async () => (await card.count()) === 0, "the card did not close");
      await page.reload();
      await settle(page);
      await page.waitForTimeout(1000);
      assert((await card.count()) === 0, "the card came back after reload");

      await badge.click();
      await card.waitFor({ state: "visible" });
      assert((await card.innerText()).includes("v1.0.0"), "the reopened card has no v1.0.0 entry");
    },
    { seen: false }
  );
}

let fatal = null;
try {
  await waitForServer();
  await runSteps();
} catch (e) {
  fatal = plain(e);
  steps.push({ step: "server", state: "fail", detail: fatal.slice(0, 1000) });
  console.log(`FAIL server - ${fatal}`);
} finally {
  await browser.close().catch(() => {});
  stopServer();
}

writeFileSync(path.join(OUT, "shots.json"), JSON.stringify([{ name: "reframe", files, steps }], null, 2));
const failed = steps.filter((s) => s.state === "fail");
console.log(`${steps.length - failed.length}/${steps.length} steps passed`);
process.exit(failed.length > 0 ? 1 : 0);
