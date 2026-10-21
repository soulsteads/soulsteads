// Optional integration suite. Dependencies live outside the repository.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const modules = process.env.SITE_QA_MODULES;
if (!modules)
  throw new Error("Set SITE_QA_MODULES to the external node_modules directory");
const { chromium } = await import(
  pathToFileURL(`${modules}/playwright/index.mjs`)
);
const { default: AxeBuilder } = await import(
  pathToFileURL(`${modules}/@axe-core/playwright/dist/index.mjs`)
);
const output = process.env.SITE_QA_OUTPUT || "/tmp/soulsteads-site-evidence";
await mkdir(output, { recursive: true });
const base = process.env.SITE_URL || "http://127.0.0.1:8096/";
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  const remoteRequests = [];
  page.on("request", (r) => {
    if (!r.url().startsWith(new URL(base).origin)) remoteRequests.push(r.url());
  });
  await page.goto(base);
  await page.locator(".filter-row").waitFor();
  assert.equal(await page.locator(".product-card:visible").count(), 4);
  await page.locator('[data-filter="preview"]').click();
  assert.equal(await page.locator(".product-card:visible").count(), 2);
  assert.match(await page.locator("#filter-status").innerText(), /2 products/);
  await page.locator('[data-filter="available"]').click();
  assert.equal(await page.locator(".preview-card:visible").count(), 0);
  await page.locator('[data-filter="all"]').click();
  await page.locator('[data-layer="messaging"]').click();
  assert.match(await page.locator("#layer-title").innerText(), /conversation/);
  assert.equal(
    await page.locator('[data-layer="messaging"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator('[data-layer="chat"]').click();
  assert.match(
    await page.locator("#layer-description").innerText(),
    /WhatsApp/,
  );
  await page.locator('[data-layer="home"]').click();
  await page.locator('[data-setup="messaging"]').click();
  assert.equal(await page.locator("#setup-home").isVisible(), false);
  assert.equal(await page.locator("#setup-messaging").isVisible(), true);
  await page.locator('[data-copy="messaging-command"]').click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /Keep tokens in a private file/,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.locator('[data-copy="messaging-command"]').click();
  assert.match(
    await page.locator("#copy-status").innerText(),
    /Clipboard unavailable/,
  );
  assert.match(
    await page.evaluate(() => window.getSelection().toString()),
    /Set up Soulsteads/,
  );
  await page.locator('[data-setup="home"]').click();
  await page.locator("summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("details").first().getAttribute("open"), "");
  await page.keyboard.press("Enter");
  assert.equal(
    await page
      .locator(".orbit-two")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  await writeFile(
    `${output}/axe.json`,
    JSON.stringify(axe.violations, null, 2),
  );
  assert.deepEqual(
    axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    "Accessibility violations",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `No horizontal overflow at ${width}`,
    );
    if (width <= 540) {
      const menu = page.locator(".menu-toggle");
      await menu.click();
      assert.equal(await menu.getAttribute("aria-expanded"), "true");
      await page.keyboard.press("Escape");
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      await menu.click();
      await page.locator('#navigation a[href="#products"]').click();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
    }
    results.push(`Responsive layout: ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  const mobileAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  await writeFile(
    `${output}/axe-mobile.json`,
    JSON.stringify(mobileAxe.violations, null, 2),
  );
  assert.deepEqual(
    mobileAxe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    "Mobile accessibility violations",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(remoteRequests, [], "No runtime third-party requests");
  await context.close();
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const fallback = await nojs.newPage();
  await fallback.goto(base);
  assert.equal(await fallback.locator(".product-card:visible").count(), 4);
  assert.equal(await fallback.locator("#setup-home").isVisible(), true);
  assert.equal(await fallback.locator("#setup-messaging").isVisible(), true);
  assert.equal(await fallback.locator("#navigation").isVisible(), true);
  assert.ok(
    await fallback.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await nojs.close();
  results.push(
    "Product filters, stack selector, setup selector, clipboard success/fallback, keyboard FAQ, mobile menu/Escape, reduced motion, no-JS fallback, no external requests, zero WCAG AA axe violations",
  );
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ base, results, passed: true }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
