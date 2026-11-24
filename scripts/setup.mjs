import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../data/products.json', import.meta.url), 'utf8'));
const products = catalog.products.filter(p => p.published.implementation && p.published.releaseTag);
const usage = 'Usage: node scripts/setup.mjs [product-slug]';
const args = process.argv.slice(2);
const [slug] = args;

if (args.length === 0 || (args.length === 1 && slug === '--help')) {
  console.log(`${usage}\n\nChoose one product:\n${products.map(p => `  ${p.slug} — ${p.need}`).join('\n')}`);
} else {
  const product = args.length === 1 && products.find(p => p.slug === slug);
  if (!product) {
    console.error(`${usage}\nRun without arguments to list products.`);
    process.exitCode = 2;
  } else {
    const { published, taggedSetup } = product;
    const { releaseTag, commit, assets } = published;
    const repo = `${catalog.organization}/${published.repo}`;
    console.log([
      `${product.name} ${releaseTag}`,
      taggedSetup.summary,
      `Requirements: ${taggedSetup.requirements.replaceAll('`', '')}`,
      `Availability: ${product.maturityDetail}`,
      `Release: ${repo}/releases/tag/${releaseTag}`,
      `Setup guide: ${repo}/blob/${releaseTag}/${taggedSetup.guide}`,
      `Reviewed commit: ${commit}`,
      ...(assets.length ? ['Downloads (verify SHA256SUMS before installing):',
        ...assets.map(name => `  ${repo}/releases/download/${releaseTag}/${name}`)] : ['Install from the tagged source; no binary or package asset is published.']),
      'No commands were run. Follow the selected product’s guide to install, configure, and verify it.',
    ].join('\n'));
  }
}
