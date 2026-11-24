import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const catalog = JSON.parse(read('data/products.json'));

test('the published llms.txt points to current setup guides', () => {
  const index = read('docs/llms.txt');
  assert.match(index, /^# Soulsteads\n\n> \S/);
  const urls = new Set([...index.matchAll(/^- \[[^\]]+\]\((https:\/\/[^)]+)\)/gm)].map(([, url]) => url));
  assert.ok(urls.has(`${catalog.siteUrl}#start-here`));

  for (const product of catalog.products) {
    const { implementation, repo, releaseTag, ref } = product.published;
    if (!implementation || !releaseTag) continue;
    const guideBase = `${catalog.organization}/${repo}/blob/${ref}/${product.taggedSetup.guide.split('#')[0]}`;
    assert.ok([...urls].some(url => url.split('#')[0] === guideBase),
      `${product.name} needs its current setup guide`);
  }

  assert.ok(urls.has(`${catalog.organization}/soulsteads#print-a-setup-plan`));
});

test('Agent Home website guides use the same release commit as the catalog', () => {
  const { published, taggedSetup } = catalog.products.find(p => p.slug === 'agent-home');
  const repo = `${catalog.organization}/${published.repo}`;
  const guideRoot = `${repo}/blob/${published.commit}/`;
  const html = read('docs/index.html');
  const index = read('docs/llms.txt');
  const siteLinks = [...html.matchAll(/href="([^"]+)"/g)].map(([, url]) => url);
  const indexLinks = [...index.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(([, url]) => url);

  for (const { surface, urls, guides } of [
    { surface: 'website', urls: siteLinks, guides: [taggedSetup.guide, 'docs/runtimes.md', 'docs/hermes-import.md'] },
    { surface: 'llms.txt', urls: indexLinks, guides: [taggedSetup.guide, 'docs/hermes-import.md'] },
  ]) {
    for (const url of urls.filter(url => url.startsWith(`${repo}/blob/`) || url.startsWith(`${repo}#`))) {
      assert.ok(url.startsWith(guideRoot), `${surface} guide is not release-pinned: ${url}`);
    }
    for (const path of guides) {
      assert.ok(urls.includes(`${guideRoot}${path}`), `${surface} is missing ${path} at the release commit`);
    }
  }
});

test('the site does not advertise specific tagged releases', () => {
  const pages = readdirSync(new URL('../docs/', import.meta.url), { recursive: true }).filter(path => path.endsWith('.html'));
  const version = /(?<![\w.])v?\d+\.\d+\.\d+(?!\w|\.\d)/i;
  for (const name of [...pages, 'llms.txt']) {
    assert.equal(read(`docs/${name}`).match(version)?.[0], undefined, name);
  }
  const html = read('docs/index.html');
  const readme = read('README.md');
  for (const journey of catalog.journeys.filter(({ source }) => source === 'tagged')) {
    const { published } = catalog.products.find(({ slug }) => slug === journey.product);
    for (const { path, websitePath = path } of journey.guides ?? [journey.guide]) {
      const repo = `${catalog.organization}/${published.repo}`;
      assert.ok(html.includes(`${repo}/blob/${published.ref}/${websitePath}`), `${journey.id} website guide`);
      assert.ok(readme.includes(`${repo}/blob/${published.releaseTag}/${path}`), `${journey.id} README release guide`);
    }
  }
  for (const journey of catalog.journeys.filter(({ source }) => source === 'preview')) {
    const { published } = catalog.products.find(({ slug }) => slug === journey.product);
    for (const { path } of journey.guides ?? [journey.guide]) {
      assert.ok(html.includes(`${catalog.organization}/${published.repo}/blob/${published.commit}/${path}`),
        `${journey.id} website guide must stay pinned`);
    }
  }
});
