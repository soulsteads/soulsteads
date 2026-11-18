// Maintainer-only source generation. Committed docs/ remains a buildless site.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = new URL("../", import.meta.url);
const escape = (x) => String(x).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const prose = (x) => escape(x).replace(/`([^`]+)`/g, "<code>$1</code>");
const list = (items) => `<ul class="feature-list">${items.map((x) => `<li>${prose(x)}</li>`).join("")}</ul>`;
const links = (items) => items.map((x) => `<a class="text-link" href="${escape(x.href)}">${escape(x.label)} ↗</a>`).join(" · ");
export function renderLineup(data, html) {
const cards = data.products.map((p) => {
  const state = p.maturity === "early" ? "available" : p.maturity;
  const details = [
    `<p>${prose(p.maturityDetail)}</p>`,
    p.prerequisites ? `<h4>Before you start</h4>${list(p.prerequisites)}` : "",
    p.does ? `<h4>Published capabilities</h4>${list(p.does)}` : `<h4>Planned direction</h4>${list(p.direction || [])}`,
    `<h4>What it owns</h4>${list(p.owns)}<h4>What stays separate</h4>${list(p.doesNotOwn)}`,
    p.limits.length ? `<h4>Current limits</h4>${list(p.limits)}` : "",
    p.journey ? `<h4>${escape(p.journey.title)}</h4>${p.journey.steps.map((step) => `<h5>${escape(step.title)}</h5>${step.note ? `<p>${prose(step.note)}</p>` : ""}<pre><code>${escape(step.code)}</code></pre>`).join("")}<p>${prose(p.journey.after)}</p>${links(p.journey.guides)}` : `<p><strong>${escape(p.notPublished.headline)}</strong> — ${prose(p.notPublished.body)}</p>`,
  ].join("\n");
  return `<article class="product-card ${state === "preview" ? "preview-card" : ""}" data-status="${state}" id="${p.slug}">
    <div class="card-top"><span class="product-icon mint" aria-hidden="true">${p.icon}</span><span class="badge">${escape(data.maturityLevels[p.maturity].badge)}</span></div>
    <p class="card-kicker">${escape(p.kicker)}</p><h3>${escape(p.name)}</h3><p class="card-tagline">${escape(p.tagline)}</p>
    <p class="card-description">${escape(p.purpose)}</p><p class="fine-print">${prose(p.maturityDetail)}</p>
    <details class="product-details"><summary>${p.journey ? "Setup, prerequisites and limits" : "Direction and publication status"}</summary>${details}</details>
    <div class="card-bottom">${links(p.links)}</div></article>`;
}).join("\n");
html = html.replace(/<div class="product-grid">[\s\S]*?<\/div>\s*<\/section>/, `<div class="product-grid">\n${cards}\n</div>\n</section>`);
for (const [filter,maturity] of [["all",null],["available","early"],["preview","preview"],["planned","planned"]]) {
  const count=data.products.filter(p=>!maturity||p.maturity===maturity).length;
  const pattern=new RegExp(`(<button[^>]*data-filter="${filter}"[^>]*>[\\s\\S]*?<span>)\\d+(</span>)`);
  html=html.replace(pattern,(_,start,end)=>start+String(count).padStart(2,"0")+end);
}
const publication=`<p class="fine-print" id="lineup-publication">Public source checked ${escape(data.factsCheckedOn)}. Internal development candidates are not public releases. Open each product for its prerequisites, standalone setup or publication status.</p>`;
if (html.includes('id="lineup-publication"')) html=html.replace(/<p[^>]*id="lineup-publication"[^>]*>[\s\S]*?<\/p>/,publication);
else html=html.replace('<div class="product-grid">',publication+'<div class="product-grid">');
const combination = `<aside class="optional-combination"><h3>${escape(data.composition.title)}</h3><p>${escape(data.composition.intro)}</p>${list(data.composition.steps.filter((s) => s.connection).map((s) => `${s.role}: ${s.connection}`))}${list(data.composition.notes)}${list(data.composition.limits)}</aside>`;
if (html.includes('<!-- optional-combination -->')) html=html.replace(/<!-- optional-combination -->[\s\S]*?<!-- end-optional-combination -->/,`<!-- optional-combination -->${combination}<!-- end-optional-combination -->`);
else html=html.replace('<section class="stack-section"', `<!-- optional-combination -->${combination}<!-- end-optional-combination -->\n<section class="stack-section"`);
const names=products=>products.map(p=>p.name).join(", ");
const available=data.products.filter(p=>p.maturity==="early");
const generated={
  availability: `${names(available)} have public implementations and setup documentation. ${data.products.filter(p=>p.maturity!=="early").map(p=>`${p.name} ${p.maturity==="preview"?"remains a preview":"is planned and in development"}. ${p.notPublished.body}`).join(" ")}`,
  packaging: `${names(available)} currently install or build from source. Check each card's setup and repository release page before installing; there are no tagged releases or prebuilt packages in the inspected public artifacts. Other products have no public setup yet.`,
  license: `${available.map(p=>`${p.name}: ${p.license}`).join("; ")}. Read the source, report a bug, or propose a change. Unpublished projects will state their licensing and setup details when available.`,
};
const faq=data.faq.map(item=>{
  const answer=item.generated?generated[item.generated]:item.a;
  if(!item.q||!answer)throw Error("FAQ requires a question and a known answer source");
  return `<details><summary>${escape(item.q)}<span aria-hidden="true">+</span></summary><p>${prose(answer)}</p>${item.links?links(item.links):""}</details>`;
}).join("\n");
html=html.replace(/(<div class="faq-list">)[\s\S]*?(<\/div>\s*<\/section>\s*<section class="closing)/,`$1${faq}$2`);
return html;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file=new URL("docs/index.html",root);
  const data=JSON.parse(readFileSync(new URL("data/products.json",root),"utf8"));
  writeFileSync(file,renderLineup(data,readFileSync(file,"utf8")));
}
