import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderLineup } from "../scripts/render-lineup.mjs";
const data=JSON.parse(readFileSync(new URL("../data/products.json",import.meta.url),"utf8"));
const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
test("committed lineup exactly reflects public source data",()=>{
  assert.equal(renderLineup(data,html),html);
  for(const product of data.products)assert.ok(html.includes(`id="${product.slug}"`));
  for(const item of data.faq)assert.ok(html.includes(item.q));
  assert.doesNotMatch(html,/undefined/);
});
test("regeneration updates publication date, counts and FAQ",()=>{
  const changed=structuredClone(data);
  changed.factsCheckedOn="2030-01-02";
  changed.products.find(p=>p.maturity==="planned").maturity="preview";
  changed.faq[0]={q:"Updated fixture question?",a:"Updated fixture answer."};
  const rendered=renderLineup(changed,html);
  assert.match(rendered,/Public source checked 2030-01-02/);
  assert.match(rendered,/data-filter="planned"[^>]*>[^<]*<span>01<\/span>/);
  assert.match(rendered,/data-filter="preview"[^>]*>[^<]*<span>02<\/span>/);
  assert.ok(rendered.includes("Updated fixture answer."));
  assert.equal(renderLineup(changed,rendered),rendered);
});
