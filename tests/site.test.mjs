import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(resolve(root, "docs/index.html"), "utf8");

test("four products have truthful public availability", () => {
  assert.equal((html.match(/data-status="available"/g) || []).length, 2);
  assert.equal((html.match(/data-status="preview"/g) || []).length, 2);
  for (const name of [
    "agent-home",
    "agent-messaging",
    "agent-forge",
    "model-router",
  ]) {
    assert.ok(html.includes(`id="${name}"`));
    assert.ok(
      html.includes(`https://github.com/soulsteads/soulsteads-${name}`),
    );
  }
  assert.match(html.replace(/\s+/g, " "), /not installable releases/);
});
test("local resources and anchor targets exist", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "unique element IDs");
  for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (link.startsWith("#")) {
      if (link.length > 1) assert.ok(ids.includes(link.slice(1)), link);
    } else if (!link.startsWith("https://")) {
      assert.ok(readFileSync(resolve(root, "docs", link)).length, link);
    }
  }
});
test("no third-party runtime requests or tracking", () => {
  assert.ok(!html.match(/<script[^>]+src="https?:/));
  assert.ok(!html.match(/<link[^>]+href="https?:/));
  const js = readFileSync(resolve(root, "docs/assets/site.js"), "utf8");
  assert.ok(!js.match(/\b(fetch|localStorage|document\.cookie|eval)\s*[.(]/));
  assert.ok(!js.includes("innerHTML"));
});
test("setup and safety information survive without JavaScript", () => {
  for (const id of ["setup-home", "setup-messaging"]) {
    assert.ok(html.includes(`class="quickstart" id="${id}"`));
  }
  assert.match(html, /not a kill switch/);
  assert.match(html, /do not sandbox/);
});
