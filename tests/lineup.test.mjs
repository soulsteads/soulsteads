import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderLineup, renderReadme, renderReleases, renderSetupSkill } from "../scripts/render-lineup.mjs";
const data=JSON.parse(readFileSync(new URL("../data/products.json",import.meta.url),"utf8"));
const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
const readme=readFileSync(new URL("../README.md",import.meta.url),"utf8");
const releasesDoc=readFileSync(new URL("../RELEASES.md",import.meta.url),"utf8");
const skill=readFileSync(new URL("../.agents/skills/soulsteads-setup/SKILL.md",import.meta.url),"utf8");
test("committed lineup exactly reflects public source data",()=>{
  assert.equal(renderLineup(data,html),html);
  assert.equal(renderReadme(data,readme),readme);
  assert.equal(renderReleases(data,releasesDoc),releasesDoc);
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
  assert.ok(!renderReleases(changed,releasesDoc).includes(changed.factsCheckedOn), 'review date must not appear in the release catalog');
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

test('README and public site point to a separate release catalog', () => {
  assert.doesNotMatch(readme, /^## Released on GitHub$/m, 'the full release catalog stays out of the README');
  assert.match(readme, /\]\(RELEASES\.md\)/);
  assert.match(readme, /<a name="released-on-github"><\/a>/, 'preserve old catalog bookmarks');
  assert.doesNotMatch(readme, /\/releases\/tag\//);

  const catalogUrl = `${data.organization}/soulsteads/blob/main/RELEASES.md`;
  const siteCatalogLinks = [...html.matchAll(/href="([^"]+)">release catalog<\/a>/g)].map(([, href]) => href);
  assert.ok(siteCatalogLinks.length > 0, 'the website offers the release catalog');
  assert.ok(siteCatalogLinks.every(href => href === catalogUrl));
  const llms = readFileSync(new URL('../docs/llms.txt', import.meta.url), 'utf8');
  assert.ok(llms.includes(`](${catalogUrl})`));
});

test('Tools at a glance links each product name to its GitHub repository', () => {
  const lineup = readme.split('<!-- readme-lineup -->')[1]?.split('<!-- end-readme-lineup -->')[0];
  assert.ok(lineup, 'the README keeps the product overview');
  const products = data.products.filter(p => p.published.implementation);
  assert.deepEqual(lineup.trim().split('\n'), products.map(p => {
    const prefix = `- **[${p.name}](${data.organization}/${p.published.repo})**`;
    return p.published.releaseTag
      ? `${prefix} — ${p.taggedSetup.summary}`
      : `${prefix} (source preview) — ${p.purpose}`;
  }));
});

test('the separate catalog gives each tagged tool a purpose and matching links', () => {
  const text = renderReleases(data, releasesDoc);
  assert.match(text, /downloads and checksums/i);
  const releases = text.split('<!-- release-catalog -->')[1]?.split('<!-- end-release-catalog -->')[0];
  assert.ok(releases, 'the catalog has a generated release section');
  const [tagged, preview] = releases.split('\n## Public source preview\n');
  const entries = tagged.split('\n## ').slice(1);
  const products = data.products.filter(p => p.published.implementation && p.published.releaseTag);
  assert.deepEqual(entries.map(entry => entry.split('\n')[0]), products.map(p => p.name));
  assert.doesNotMatch(text, /No release to install|\[Agent Voice\]|\[Agent Harness\]/);
  for (const [i, p] of products.entries()) {
    const { repo, releaseTag } = p.published;
    const repoUrl = `${data.organization}/${repo}`;
    const [, purpose, links, requirements] = entries[i].trim().split('\n\n');
    assert.equal(purpose, p.purpose, `${p.name} explains its value before setup details`);
    assert.ok(links?.includes(`${repoUrl}/releases/tag/${releaseTag}`), p.name);
    assert.ok(links?.includes(`${repoUrl}/blob/${releaseTag}/${p.taggedSetup.guide}`), `${p.name} setup must match the release`);
    assert.ok(requirements?.includes(p.taggedSetup.requirements), `${p.name} keeps its prerequisites`);
  }
  assert.match(releases, /Linux x86-64 archive/);
  assert.match(releases, /Python packages/);
  const sourceOnly = structuredClone(data);
  sourceOnly.products.find(p => p.slug === 'agent-home').published.assets = [];
  assert.match(renderReleases(sourceOnly, releasesDoc), /## Agent Home\n\n[^\n]+\n\n[^\n]+ · Source only/);
  assert.match(releases, /nonempty sender allowlist/);
  assert.match(releases, /Tailnet IPv4/);
  assert.equal(preview, undefined);
  const untagged = structuredClone(data);
  const skillstore = untagged.products.find(p => p.slug === "agent-skillstore");
  skillstore.published.releaseTag = null;
  const previewText = renderReleases(untagged, releasesDoc);
  assert.doesNotMatch(previewText, /^## Agent Skillstore$/m);
  assert.match(previewText, /## Public source preview\n\n- \*\*\[Agent Skillstore\][^\n]*No tagged release/);
});
