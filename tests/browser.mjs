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
// Mount docs/ at /soulsteads/ to match the GitHub Pages project site.
const base = process.env.SITE_URL || "http://127.0.0.1:8096/soulsteads/";
const browser = await chromium.launch({ headless: true, executablePath: process.env.SITE_QA_BROWSER || undefined });
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    colorScheme: "dark", // The site should stay light even on a dark device.
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
  const white = "rgb(255, 255, 255)";
  assert.equal(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundColor), white, "Homepage canvas");
  assert.equal(await page.locator('meta[name="theme-color"]').getAttribute("content"), "#ffffff");
  for (const asset of ["lineup-map.svg", "agent-connections.svg", "agent-connections-compact.svg", "social.svg", "social.png"]) {
    const pixel = await page.evaluate(async (asset) => {
      const image = new Image();
      image.src = new URL(`assets/${asset}`, document.baseURI);
      await image.decode();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      // Sample inside rounded corners, well clear of the artwork.
      ctx.drawImage(image, -40, -20);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    }, asset);
    assert.deepEqual(pixel, [255, 255, 255, 255], `${asset} canvas`);
  }
  const missing = await context.newPage();
  await missing.goto(new URL("404.html", base).href);
  assert.equal(await missing.locator("body").evaluate(el => getComputedStyle(el).backgroundColor), white, "404 canvas");
  assert.equal(await missing.locator('meta[name="theme-color"]').getAttribute("content"), "#ffffff");
  await missing.close();
  await page.locator(".filter-row").waitFor();
  assert.equal(await page.locator(".product-card:visible").count(), 6);
  assert.equal(await page.locator('[data-filter="preview"]').count(), 0);
  assert.equal(await page.locator("#agent-skillstore").isVisible(), true);
  await page.locator('[data-filter="available"]').click();
  assert.equal(await page.locator(".preview-card:visible").count(), 0);
  assert.equal(await page.locator("#model-router").isVisible(), true);
  assert.equal(await page.locator(".product-card:visible").count(), 6);
  assert.equal(await page.locator('[data-filter="planned"]').count(), 0);
  assert.equal(await page.locator('.setup-choices li').count(), 6);
  await page.getByRole('link', { name: 'Agent Forge details' }).click();
  assert.equal(new URL(page.url()).hash, '#agent-forge');
  assert.equal(await page.locator('#agent-forge').isVisible(), true);
  await page.locator('[data-filter="all"]').click();
  assert.equal(await page.locator('[data-filter="all"]').getAttribute('aria-pressed'), 'true');
  await page.locator('[data-copy="agent-setup-prompt"]').click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /Keep tokens private/,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.locator('[data-copy="agent-setup-prompt"]').click();
  assert.match(
    await page.locator("#copy-status").innerText(),
    /Clipboard unavailable/,
  );
  assert.match(
    await page.evaluate(() => window.getSelection().toString()),
    /Help me set up one Soulsteads tool/,
  );
  await page.locator("#faq summary").first().focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.locator("#faq details").first().getAttribute("open"), "");
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
    await page.locator(".product-details summary").first().click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Expanded setup fits ${width}px`);
    await page.locator(".product-details summary").first().click();
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
    await page.locator('#start').scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `Setup has no horizontal overflow at ${width}`,
    );
    assert.equal(await page.locator("#agent-setup-prompt").isVisible(), true);
    results.push(`Responsive layout, including setup: ${width}px`);
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
  assert.equal(await fallback.locator(".product-card:visible").count(), 6);
  assert.equal(await fallback.locator('.setup-choices li:visible').count(), 6);
  assert.equal(await fallback.getByRole('link', { name: 'Agent Skillstore details' }).isVisible(), true);
  assert.equal(await fallback.locator('#agent-setup-prompt').isVisible(), true);
  for (const image of await fallback.locator('figure img').all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate(img => img.decode());
  }
  assert.equal(await fallback.locator("#navigation").isVisible(), true);
  assert.ok(
    await fallback.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await nojs.close();
  results.push(
    "Product filters and setup links, clipboard success/fallback, keyboard FAQ, mobile menu/Escape, reduced motion, no-JS setup and diagrams, no external requests, zero WCAG AA axe violations",
  );
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ base, results, passed: true }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, results }, null, 2));
} finally {
  await browser.close();
}
