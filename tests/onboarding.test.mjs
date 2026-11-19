import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const catalog = JSON.parse(read('data/products.json'));
const html = read('docs/index.html');
const readme = read('README.md');

test('every public implementation gets one setup entry, including the Forge preview', () => {
  const setup = html.match(/<section\b[^>]*id="start"[\s\S]*?<\/section>/)[0];
  const expected = ['agent-forge', 'agent-home', 'agent-messaging', 'agent-workboard', 'model-router'];
  assert.deepEqual([...setup.matchAll(/href="#(agent-[\w-]+|model-router)"/g)].map(([, slug]) => slug).sort(), expected);
  assert.match(setup, /id="agent-setup-prompt"/);
  assert.match(setup, /soulsteads-setup\/SKILL\.md/);
  assert.match(setup, /soulsteads-connect\/SKILL\.md/);
  assert.doesNotMatch(html, /using the release branch|no tagged releases|Next on the horizon/);
  assert.match(html, /GitHub releases.*source-only/i);
  assert.match(html, /#agent-harness|id="agent-harness"/);
});

test('both public surfaces explain the lineup and share the diagrams', () => {
  for (const name of ['lineup-map', 'agent-connections']) {
    assert.ok(readme.includes(`docs/assets/${name}.svg`));
    assert.ok(html.includes(`assets/${name}.svg`));
    assert.match(read(`docs/assets/${name}.svg`), /<title\b/);
  }
  for (const p of catalog.products) assert.ok(readme.includes(p.name), p.name);
  assert.match(readme, /\]\(skills\/soulsteads-setup\/SKILL\.md\)/);
  assert.match(readme, /\]\(skills\/soulsteads-connect\/SKILL\.md\)/);
});

test('setup skill covers exactly the published implementations at the reviewed pins', () => {
  const skill = read('skills/soulsteads-setup/SKILL.md');
  const pins = [...skill.matchAll(/\| `https:\/\/github.com\/soulsteads\/([\w-]+)\.git` \/ `main` \| `([a-f0-9]{40})`/g)].map(([, repo, sha]) => `${repo}:${sha}`);
  assert.deepEqual(pins.sort(), catalog.products.filter(p => p.published.implementation).map(p => `${p.published.repo}:${p.published.commit}`).sort());
  for (const name of ['soulsteads-setup', 'soulsteads-connect']) {
    assert.match(read(`skills/${name}/SKILL.md`), new RegExp(`^---\\nname: ${name}\\ndescription: .{1,60}\\n---\\n`));
  }
});

test('Messaging working directory is not treated as Home translation or a history migration', () => {
  const skill = read('skills/soulsteads-connect/SKILL.md').split('### Agent/host → Agent Workboard')[0];
  assert.match(skill, /`acp\.backends\.soulsteads`/);
  assert.match(skill, /`soulsteads run <home> -- acp`/);
  assert.match(skill, /`<home>\/workspace`[^.]*not the canonical Home root/);
  assert.match(skill, /Do not use `\/clear` or `\/reset`[^.]*\. They delete current session history[^.]*explicit approval/);
  assert.match(html, /working directory, not an Agent Home import/);
  assert.match(readme, /working directory, not an Agent Home import/);
});
