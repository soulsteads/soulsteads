import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderLineup, renderReadme, renderSetupSkill } from "../scripts/render-lineup.mjs";
const data=JSON.parse(readFileSync(new URL("../data/products.json",import.meta.url),"utf8"));
const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");
const skill=readFileSync(new URL("../.agents/skills/soulsteads-setup/SKILL.md",import.meta.url),"utf8");
test("committed lineup exactly reflects public source data",()=>{
  assert.equal(renderLineup(data,html),html);
  assert.equal(renderReadme(data,readme),readme);
  assert.equal(renderSetupSkill(data,skill),skill);
  assert.doesNotMatch(html,/data-filter="preview"/);
  for(const product of data.products.filter(p=>p.published.implementation))assert.ok(html.includes(`id="${product.slug}"`));
  for(const item of data.faq)assert.ok(html.includes(item.q));
  assert.doesNotMatch(html,/undefined/);
});
test("regeneration updates counts and FAQ without publishing the catalog review date",()=>{
  const changed=structuredClone(data);
  changed.factsCheckedOn="2030-01-02";
  changed.products.find(p=>p.maturity==="early").maturity="preview";
  changed.faq[0]={q:"Updated fixture question?",a:"Updated fixture answer."};
  const rendered=renderLineup(changed,html);
  assert.ok(!rendered.includes(changed.factsCheckedOn), 'review date must not appear on the website');
  assert.match(rendered,/data-filter="available"[^>]*>[^<]*<span>05<\/span>/);
  assert.match(rendered,/data-filter="preview"[^>]*>[^<]*<span>01<\/span>/);
  assert.ok(rendered.includes("Updated fixture answer."));
  assert.equal(renderLineup(changed,rendered),rendered);
  assert.ok(!renderReadme(changed,readme).includes(changed.factsCheckedOn), 'review date must not appear in the README');
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
  assert.match(releases, /Linux x86-64 archive/);
  assert.match(releases, /Python packages/);
  assert.match(releases, /Source only/);
  assert.match(releases, /nonempty sender allowlist/);
  assert.match(releases, /Tailnet IPv4/);
  assert.equal(preview, undefined);
  const untagged = structuredClone(data);
  const skillstore = untagged.products.find(p => p.slug === "agent-skillstore");
  skillstore.published.releaseTag = null;
  assert.match(renderReadme(untagged, readme), /\[Agent Skillstore\][^\n]*No tagged release/);
  assert.ok(text.indexOf('## Released on GitHub') < text.indexOf('lineup-map.svg'));
});
