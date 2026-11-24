import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('data/products.json', root), 'utf8'));
const script = fileURLToPath(new URL('scripts/setup.mjs', root));
const run = (...args) => spawnSync(process.execPath, [script, ...args], {
  cwd: tmpdir(), encoding: 'utf8', timeout: 5000, env: { PATH: '' },
});

test('the setup helper lists selectable tools and prints an offline plan from the release catalog', () => {
  const list = run();
  assert.equal(list.status, 0, list.stderr);
  const help = run('--help');
  assert.equal(help.status, 0, help.stderr);
  assert.equal(help.stdout, list.stdout);
  for (const product of catalog.products) assert.match(list.stdout, new RegExp(product.slug));
  const plan = run('agent-workboard');
  assert.equal(plan.status, 0, plan.stderr);
  const workboard = catalog.products.find(p => p.slug === 'agent-workboard');
  assert.ok(plan.stdout.includes(`/blob/${workboard.published.releaseTag}/${workboard.taggedSetup.guide}`));
  assert.ok(plan.stdout.includes(workboard.published.commit));
  assert.match(plan.stdout, /SQLite/i);
  assert.match(plan.stdout, /no commands were run/i);
});

test('each product plan identifies its own verified installation path', () => {
  for (const { slug, published, taggedSetup } of catalog.products) {
    const plan = run(slug);
    assert.equal(plan.status, 0, plan.stderr);
    assert.ok(plan.stdout.includes(published.commit), slug);
    assert.ok(plan.stdout.includes(`/releases/tag/${published.releaseTag}`), slug);
    assert.ok(plan.stdout.includes(`/blob/${published.releaseTag}/${taggedSetup.guide}`), slug);
    assert.ok(plan.stdout.includes(taggedSetup.requirements.replaceAll('`', '')), slug);
    for (const asset of published.assets) {
      assert.ok(plan.stdout.includes(`/releases/download/${published.releaseTag}/${asset}`), asset);
    }
    if (published.assets.length) {
      assert.ok(published.assets.includes('SHA256SUMS'), slug);
      assert.match(plan.stdout, /verify SHA256SUMS before installing/);
    } else {
      assert.doesNotMatch(plan.stdout, /\/releases\/download\//);
      assert.match(plan.stdout, /Install from the tagged source/);
    }
  }
});

test('the setup helper rejects unknown selections or extra arguments without printing a plan', () => {
  for (const args of [['not-a-product'], ['agent-workboard', '--install']]) {
    const result = run(...args);
    assert.equal(result.status, 2, result.stderr);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /usage/i);
  }
});
