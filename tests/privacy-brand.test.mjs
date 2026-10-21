import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("docs/index.html", root), "utf8");
test("official logo is used in header, footer, hero and favicon", () => {
  for (const tag of ["header", "footer"]) {
    const area = html.match(
      new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`),
    )[1];
    assert.match(area, /assets\/soulsteads-logo\.png/);
  }
  assert.match(html, /core-logo/);
  assert.match(html, /rel="icon"[^>]+href="assets\/soulsteads-logo\.png"/);
});
test("published textual files contain no personal email or private address literals", () => {
  function visit(path) {
    for (const f of readdirSync(path, { withFileTypes: true })) {
      const file = new URL(f.name + (f.isDirectory() ? "/" : ""), path);
      if (f.isDirectory()) visit(file);
      else if (!f.name.endsWith(".png")) {
        const text = readFileSync(file, "utf8");
        assert.ok(
          !/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
          `Email in ${file}`,
        );
        assert.ok(
          !/\b(?:192\.168\.\d+\.\d+|100\.64\.\d+\.\d+)\b/.test(text),
          `Private address in ${file}`,
        );
        assert.ok(
          !/\/(?:home|Users)\/[a-zA-Z0-9_-]+\//.test(text),
          `Personal path in ${file}`,
        );
      }
    }
  }
  visit(new URL("docs/", root));
});
