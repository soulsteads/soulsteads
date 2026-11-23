// Maintainer-only generation. README and docs are committed; no runtime build.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);
const escape = (x) => String(x).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const prose = (x) => escape(x).replace(/`([^`]+)`/g, '<code>$1</code>');
const list = (items) => `<ul class="feature-list">${items.map((x) => `<li>${prose(x)}</li>`).join('')}</ul>`;
const link = ({ href, label }) => `<a class="text-link" href="${escape(href)}">${escape(label)} <span aria-hidden="true">↗</span></a>`;
const links = (items) => items.map(link).join(' · ');
const state = (p) => p.maturity === 'early' ? 'available' : p.maturity;
const publicProducts = (data) => data.products.filter((p) => p.published.implementation);

function journeyContext(data, journey, { website = false } = {}) {
  const product = data.products.find((p) => p.slug === journey.product);
  if (!product?.published?.repo) throw Error(`Journey ${journey.id} references an unknown published product`);
  const ref = journey.source === 'tagged' ? (website ? product.published.ref : product.published.releaseTag)
    : journey.source === 'preview' ? product.published.commit : null;
  if (!ref) throw Error(`Journey ${journey.id} has no reviewed source reference`);
  if (!Array.isArray(journey.guides) || !journey.guides.length || journey.guides.some((guide) => !guide?.path || !guide?.label)) {
    throw Error(`Journey ${journey.id} requires at least one guide with a path and label`);
  }
  return {
    product,
    guides: journey.guides.map(({ path, label, note }) => ({
      href: `${data.organization}/${product.published.repo}/blob/${ref}/${path}`,
      label,
      note,
    })),
    sourceLabel: journey.source === 'tagged'
      ? (website ? 'Source guide' : `Tagged source ${ref}`)
      : 'Source preview',
  };
}

function renderStartHereHtml(data) {
  const cards = data.journeys.map((journey) => {
    const { product, guides, sourceLabel } = journeyContext(data, journey, { website: true });
    return `<article class="start-here-card" data-journey="${escape(journey.id)}" data-source="${escape(journey.source)}">
      <h3>${escape(journey.title)}</h3>
      <p class="journey-source">${escape(product.name)} · ${escape(sourceLabel)}</p>
      <p>${prose(journey.summary)}</p>
      <ul class="journey-guides">${guides.map(guide => `<li>${link(guide)}${guide.note ? `<div>${prose(guide.note)}</div>` : ''}</li>`).join('')}</ul>
    </article>`;
  }).join('\n');
  return `<section class="section wrap start-here-section" id="start-here" aria-labelledby="start-here-title">
    <div class="section-heading">
      <div><p class="eyebrow">00 / START HERE</p><h2 id="start-here-title">Start here</h2></div>
      <p>Choose a task and open its source guide. If you’re just exploring, try Workboard first. For instructions for a specific release, see the <a href="${escape(data.organization)}/soulsteads#released-on-github">release catalog</a>.</p>
    </div>
    <div class="start-here-grid">${cards}</div>
  </section>`;
}

function renderStartHereReadme(data) {
  const cards = data.journeys.map((journey) => {
    const { product, guides, sourceLabel } = journeyContext(data, journey);
    return [
      `### ${journey.title}`,
      '',
      `*${product.name} · ${sourceLabel}*`,
      '',
      journey.summary,
      '',
      ...guides.map(({ href, label, note }) => `- [${label}](${href})${note ? ` — ${note}` : ''}`),
      '',
    ].join('\n');
  });
  return [
    '## Start here',
    '',
    data.journeyIntro,
    '',
    ...cards,
  ].join('\n');
}

function block(text, name, content) {
  const begin = `<!-- ${name} -->`;
  const end = `<!-- end-${name} -->`;
  const start = text.indexOf(begin);
  const stop = text.indexOf(end, start + begin.length);
  if (start < 0 || stop < 0) throw Error(`Missing generation markers: ${name}`);
  return text.slice(0, start + begin.length) + '\n' + content + '\n' + text.slice(stop);
}

function card(data, p) {
  const setup = p.journey && `
    <h4>${escape(p.journey.title)}</h4>
${p.journey.steps.map((s) => `    <h5>${escape(s.title)}</h5>${s.note ? `<p>${prose(s.note)}</p>` : ''}<pre tabindex="0" role="region" aria-label="${escape(s.title)}"><code>${escape(s.code)}</code></pre>`).join('\n')}
    <p>${prose(p.journey.after)}</p>${links(p.journey.guides)}`;
  const sections = [
    ['Before you start', p.prerequisites],
    [p.does ? 'Published capabilities' : 'Proposed direction', p.does || p.direction],
    ['What it owns', p.owns], ['What stays separate', p.doesNotOwn], ['Current limits', p.limits],
  ];
  const details = [...sections.filter(([, items]) => items?.length).map(([title, items]) => `<h4>${title}</h4>${list(items)}`),
    setup || `<p><strong>${escape(p.notPublished.headline)}</strong> — ${prose(p.notPublished.body)}</p>`].join('\n');
  return `<article class="product-card${p.maturity === 'preview' ? ' preview-card' : ''}" data-status="${state(p)}" id="${escape(p.slug)}">
    <div class="card-top"><span class="product-icon mint" aria-hidden="true">${escape(p.icon)}</span><span class="badge">${escape(data.maturityLevels[p.maturity].badge)}</span></div>
    <h3>${escape(p.name)}</h3><p class="card-description">${escape(p.purpose)}</p><p class="fine-print">${prose(p.maturityDetail)}</p>
${p.journey ? `    <p class="card-guide">${link(p.journey.guides[0])}</p>` : ''}
    <details class="product-details"><summary>${p.journey ? 'Setup details and limits' : 'Direction and availability'}</summary>${details}</details>
${p.links.length ? `    <div class="card-bottom">${links(p.links)}</div>` : ''}
  </article>`;
}

export function renderLineup(data, html) {
  const available = publicProducts(data);
  html = block(html, 'start-here', renderStartHereHtml(data));
  html = block(html, 'product-cards', available.map((p) => card(data, p)).join('\n'));
  for (const filter of ['all', 'available', 'preview']) {
    const count = available.filter((p) => filter === 'all' || state(p) === filter).length;
    const pattern = new RegExp(`(<button[^>]*data-filter="${filter}"[^>]*>[^<]*<span>)\\d+(</span>)`);
    html = html.replace(pattern, (_, start, end) => start + String(count).padStart(2, '0') + end);
  }
  html = block(html, 'publication', `<p class="fine-print" id="lineup-publication">Public source checked ${escape(data.factsCheckedOn)} on <a href="${escape(data.organization)}">GitHub</a>. Source availability does not imply a supported deployment.</p>`);
  html = block(html, 'optional-combination', `<div class="optional-combination"><h3>${escape(data.composition.title)}</h3><p>${escape(data.composition.intro)}</p>${list(data.composition.steps.map((s) => `${s.role}: ${s.connection}`))}${[...data.composition.notes, ...data.composition.limits].map((text) => `<p>${prose(text)}</p>`).join('')}</div>`);
  html = block(html, 'setup-links', `<ul class="setup-choices">${available.map((p) => `<li><div><strong>${escape(p.name)}</strong>${p.maturity === 'preview' ? ' <span class="badge">SOURCE PREVIEW</span>' : ''}<p>${escape(p.need)}</p></div><div>${link(p.journey.guides[0])}<a href="#${escape(p.slug)}">${escape(p.name)} details</a></div></li>`).join('\n')}</ul>`);
  const names = (products) => products.map((p) => p.name).join(', ');
  const tagged = available.filter((p) => p.published.releaseTag);
  const untagged = available.filter((p) => !p.published.releaseTag);
  const generated = {
    availability: `${names(available)} have public source and setup guides. ${available.filter((p) => p.maturity === 'preview').map((p) => `${p.name} is an early preview.`).join(' ')}`,
    packaging: `GitHub releases for ${names(tagged)} are source-only. ${names(untagged)} can be built from public source but ${untagged.length === 1 ? 'has' : 'have'} no tagged release. No prebuilt release assets were listed for these tools.`,
    license: `${available.map((p) => `${p.name}: ${p.license}`).join('; ')}. See each repository’s license and notices.`,
  };
  const faq = data.faq.map((item) => {
    const answer = item.generated ? generated[item.generated] : item.a;
    if (!item.q || !answer) throw Error('FAQ requires a question and a known answer source');
    return `<details><summary>${escape(item.q)}<span aria-hidden="true">+</span></summary><p>${prose(answer)}</p>${item.links ? links(item.links) : ''}</details>`;
  }).join('\n');
  return block(html, 'faq-items', faq);
}

export function renderReadme(data, markdown) {
  const products = publicProducts(data);
  markdown = block(markdown, 'readme-start-here', renderStartHereReadme(data));
  const repoUrl = (p) => `${data.organization}/${p.published.repo}`;
  const rows = products.filter((p) => p.published.releaseTag).map((p) => {
    const repo = repoUrl(p);
    const tag = p.published.releaseTag;
    const { summary, requirements, guide } = p.taggedSetup;
    return `| **${p.name}** | [${tag}](${repo}/releases/tag/${tag}) | ${summary} | ${requirements} [Setup at ${tag}](${repo}/blob/${tag}/${guide}) |`;
  });
  const previews = products.filter((p) => !p.published.releaseTag).map((p) => {
    const guides = p.journey.guides.map(({ href, label }) => `[${label}](${href})`).join(' · ');
    return [
      `- **[${p.name}](${repoUrl(p)}/tree/${p.published.commit})** — ${p.purpose} No tagged release; for evaluation.`,
      `  **What you need:** ${p.prerequisites.join(' · ')}. ${guides}`,
    ].join('\n');
  });

  return block(markdown, 'readme-lineup', [
    '', '## Released on GitHub', '',
    'These are early, **source-only releases**: no prebuilt binaries. Check out the tag before following its setup guide; the guides and features on `main` can differ.', '',
    '| Tool | Release | Use it to | What you need / setup |', '| --- | --- | --- | --- |', ...rows,
    '', '### Public source preview', '', ...previews,

    '', `Public source and releases checked on GitHub: **${data.factsCheckedOn}**.`,
    '',
  ].join('\n'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(readFileSync(new URL('data/products.json', root), 'utf8'));
  for (const [path, render] of [['docs/index.html', renderLineup], ['README.md', renderReadme]]) {
    const file = new URL(path, root);
    const current = readFileSync(file, 'utf8');
    const updated = render(data, current);
    if (process.argv.includes('--check')) {
      if (updated !== current) {
        console.error(`${path} is out of date; run node scripts/render-lineup.mjs`);
        process.exitCode = 1;
      }
    } else if (updated !== current) {
      writeFileSync(file, updated);
    }
  }
}
