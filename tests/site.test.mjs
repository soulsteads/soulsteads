import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(resolve(root, "docs/index.html"), "utf8");

test("complete lineup has truthful public availability", () => {
  assert.equal((html.match(/data-status="available"/g) || []).length, 6);
  assert.equal((html.match(/data-status="preview"/g) || []).length, 0);
  assert.doesNotMatch(html, /data-(?:status|filter)="planned"|id="agent-(?:voice|harness)"|no public implementation to install/);
  for (const name of [
    "agent-home",
    "agent-messaging",
    "agent-forge",
    "model-router",
    "agent-workboard",
    "agent-skillstore",
  ]) {
    assert.ok(html.includes(`id="${name}"`));
    assert.ok(
      html.includes(`https://github.com/soulsteads/soulsteads-${name}`),
    );
  }
  assert.doesNotMatch(html, /Forge is an early preview|data-filter="preview"/);
});

test("Skillstore is released with a setup guide and no model requirement", () => {
  const card = html.match(/<article\b[^>]*id="agent-skillstore"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card, "Skillstore has a product card");
  assert.match(card, /data-status="available"/);
  assert.match(card, /Python wheel/);
  assert.match(card, /soulsteads-agent-skillstore\/blob\/main\/README\.md#install-from-source/);
  assert.match(card, /no harness or model account/i);
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
  assert.match(html, /<ul class="setup-choices">/);
  assert.match(html, /<code id="agent-setup-prompt">/);
  assert.match(html, /not a kill switch/);
  assert.match(html, /do not sandbox/);
});

test("Router is documented with setup links and release limitations", () => {
  const card = html.match(/<article\b[^>]*id="model-router"[\s\S]*?<\/article>/)[0];
  assert.match(card, /data-status="available"/);
  assert.match(card, /EARLY RELEASE/);
  assert.match(card, /capacity/i);
  assert.doesNotMatch(card, /not yet published|ON THE HORIZON/);
  for (const guide of ["SETUP", "COMPATIBILITY"]) {
    assert.ok(html.includes(`soulsteads-model-router/blob/main/docs/${guide}.md`));
  }
  const copy = card.replace(/\s+/g, " ");
  for (const phrase of ["Tailnet IPv4", "explicit loopback", "HTTP", "4001", "does not host models"]) {
    assert.ok(copy.includes(phrase), phrase);
  }
});
