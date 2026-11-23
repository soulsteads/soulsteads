import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderLineup, renderReadme } from "../scripts/render-lineup.mjs";
const data=JSON.parse(readFileSync(new URL("../data/products.json",import.meta.url),"utf8"));
const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");
test("committed lineup exactly reflects public source data",()=>{
  assert.equal(renderLineup(data,html),html);
  assert.equal(renderReadme(data,readme),readme);
  for(const product of data.products.filter(p=>p.published.implementation))assert.ok(html.includes(`id="${product.slug}"`));
  for(const item of data.faq)assert.ok(html.includes(item.q));
  assert.doesNotMatch(html,/undefined/);
});
test("regeneration updates publication date, counts and FAQ",()=>{
  const changed=structuredClone(data);
  changed.factsCheckedOn="2030-01-02";
  changed.products.find(p=>p.maturity==="early").maturity="preview";
  changed.faq[0]={q:"Updated fixture question?",a:"Updated fixture answer."};
  const rendered=renderLineup(changed,html);
  assert.match(rendered,/Public source checked 2030-01-02/);
  assert.match(rendered,/data-filter="available"[^>]*>[^<]*<span>03<\/span>/);
  assert.match(rendered,/data-filter="preview"[^>]*>[^<]*<span>03<\/span>/);
  assert.ok(rendered.includes("Updated fixture answer."));
  assert.equal(renderLineup(changed,rendered),rendered);
  assert.match(renderReadme(changed,readme),/checked on GitHub: \*\*2030-01-02\*\*/);
});

test('the connection diagram is accompanied by all declared notes and limits', () => {
  const changed = structuredClone(data);
  changed.composition.notes.push('Second connection note.');
  changed.composition.limits.push('Second connection limit.');
  const rendered = renderLineup(changed, html);
  const section = rendered.match(/<!-- optional-combination -->([\s\S]+?)<!-- end-optional-combination -->/)[1];
  for (const item of [...changed.composition.notes, ...changed.composition.limits]) {
    assert.ok(section.includes(item), item);
  }
});

test('README leads with tagged releases and lists only actual source previews', () => {
  const text = renderReadme(data, readme);
  const releases = text.split('## Released on GitHub\n')[1]?.split('\n### ')[0];
  assert.ok(releases, 'A release-first section is visible in the README');
  const preview = text.split('### Public source preview\n')[1]?.split('\n### ')[0];
  assert.doesNotMatch(text, /No release to install|\[Agent Voice\]|\[Agent Harness\]/);
  for (const p of data.products.filter(p => p.published.implementation)) {
    const { releaseTag } = p.published;
    if (releaseTag) {
      const row = releases.split('\n').find(line => line.startsWith(`| **${p.name}**`));
      assert.ok(row?.includes(`/releases/tag/${releaseTag}`), p.name);
      assert.ok(row.includes(`/blob/${releaseTag}/`), `${p.name} setup must match the tag`);
    } else {
      assert.ok(!releases.includes(p.name), p.name);
      assert.ok(preview?.includes(p.name), p.name);
    }
  }
  assert.match(releases, /no prebuilt binaries/i);
  assert.match(releases, /nonempty sender allowlist/);
  assert.match(releases, /Tailnet IPv4/);
  assert.match(preview, /no tagged release/i);
  assert.match(preview, /\[Agent Skillstore\][^\n]*No tagged release/);
  assert.ok(text.indexOf('## Released on GitHub') < text.indexOf('lineup-map.svg'));
});
