import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const repoUrl = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, repoUrl), 'utf8');
const catalog = JSON.parse(read('data/products.json'));
const html = read('docs/index.html');
const readme = read('README.md');

test('Claude and Codex aliases resolve both skills to the canonical files', () => {
  assert.equal(existsSync(new URL('skills', repoUrl)), false, 'no duplicate top-level skills directory');
  for (const alias of ['.claude', '.codex']) {
    assert.ok(existsSync(new URL(alias, repoUrl)), `${alias} must resolve`);
    assert.equal(readlinkSync(new URL(alias, repoUrl)), '.agents');
    for (const name of ['soulsteads-setup', 'soulsteads-connect']) {
      const skill = `skills/${name}/SKILL.md`;
      assert.equal(realpathSync(new URL(`${alias}/${skill}`, repoUrl)), realpathSync(new URL(`.agents/${skill}`, repoUrl)));
    }
  }
});

test('every public implementation gets one setup entry, including the Forge preview', () => {
  const setup = html.match(/<section\b[^>]*id="start"[\s\S]*?<\/section>/)[0];
  const expected = ['agent-forge', 'agent-home', 'agent-messaging', 'agent-skillstore', 'agent-workboard', 'model-router'];
  assert.deepEqual([...setup.matchAll(/href="#(agent-[\w-]+|model-router)"/g)].map(([, slug]) => slug).sort(), expected);
  assert.match(setup, /id="agent-setup-prompt"/);
  assert.match(setup, /\/blob\/main\/\.agents\/skills\/soulsteads-setup\/SKILL\.md/);
  assert.match(setup, /\/blob\/main\/\.agents\/skills\/soulsteads-connect\/SKILL\.md/);
  assert.doesNotMatch(html, /using the release branch|no tagged releases|Next on the horizon/);
  assert.match(html, /GitHub releases.*source-only/i);

});

test('both public surfaces explain the lineup and share the diagrams', () => {
  for (const name of ['lineup-map', 'agent-connections']) {
    assert.ok(readme.includes(`docs/assets/${name}.svg`));
    assert.ok(html.includes(`assets/${name}.svg`));
    assert.match(read(`docs/assets/${name}.svg`), /<title\b/);
  }
  for (const p of catalog.products) assert.ok(readme.includes(p.name), p.name);
  assert.match(readme, /\]\(\.agents\/skills\/soulsteads-setup\/SKILL\.md\)/);
  assert.match(readme, /\]\(\.agents\/skills\/soulsteads-connect\/SKILL\.md\)/);
});

test('the README leads with the shared diagram and the diagram includes standalone Forge', () => {
  const overview = readme.indexOf('## How the tools fit together');
  const diagram = readme.indexOf('(docs/assets/agent-connections.svg)', overview);
  assert.ok(overview >= 0 && diagram > overview && diagram < readme.indexOf('## Start here'));
  const svg = read('docs/assets/agent-connections.svg');
  assert.match(svg, /<text\b[^>]*>Agent Forge<\/text>/);
  assert.match(svg, /<desc\b[^>]*>[^<]*Forge[^<]*no harness/i);
  const stack = html.match(/<section\b[^>]*id="stack"[\s\S]*?<\/section>/)[0];
  assert.match(stack, /assets\/agent-connections\.svg[^>]*alt="[^"]*Forge/);
  assert.match(stack, /Forge[\s\S]*without a model or harness/);
});

test('the detailed connection graphic is the main diagram and the compact diagram is optional', () => {
  const svg = read('docs/assets/agent-connections.svg');
  assert.match(svg, /SOULSTEADS \/ FLEXIBLE CONNECTIONS/);
  assert.match(svg, /One agent, optional connections\./);
  const stack = html.match(/<section\b[^>]*id="stack"[\s\S]*?<\/section>/)[0];
  assert.match(stack, /<img src="assets\/agent-connections\.svg"/);
  assert.match(stack, /href="assets\/agent-connections-compact\.svg"/);
  assert.match(readme, /!\[[^\]]+\]\(docs\/assets\/agent-connections\.svg\)/);
  assert.match(readme, /\[Compact diagram\]\(docs\/assets\/agent-connections-compact\.svg\)/);
  assert.match(read('docs/assets/agent-connections-compact.svg'), /<text\b[^>]*>Agent Forge<\/text>/);
});

test('both connection diagrams have an opaque white canvas', () => {
  for (const name of ['agent-connections', 'agent-connections-compact']) {
    const svg = read(`docs/assets/${name}.svg`);
    const [, width, height] = svg.match(/<svg\b[^>]*viewBox="0 0 (\d+) (\d+)"/);
    assert.match(svg, new RegExp(`^  <rect width="${width}" height="${height}"(?: rx="\\d+")? fill="#ffffff"`, 'm'), name);
  }
});

test('both diagram versions show a distinct icon for each labeled tool and the harness', () => {
  for (const name of ['agent-connections', 'agent-connections-compact']) {
    const svg = read(`docs/assets/${name}.svg`);
    for (const node of ['harness', 'home', 'messaging', 'workboard', 'router', 'forge']) {
      assert.match(svg, new RegExp(`<symbol id="glyph-${node}"(?:\\s|>)`), `${name}: ${node} icon artwork`);
      assert.match(svg, new RegExp(`<use id="icon-${node}" href="#glyph-${node}"[^>]*aria-hidden="true"`), `${name}: ${node} visible icon`);
    }
  }
});

test('the diagram shows four optional connections to a chosen harness and no connection to Forge', () => {
  const svg = read('docs/assets/agent-connections.svg');
  assert.match(svg, /<text\b[^>]*>User’s chosen agent<\/text>\s*<text\b[^>]*>\/ harness<\/text>/);
  assert.match(svg, /Works on its own\. Connections stay optional\./);
  assert.match(svg, /No direct dependencies between capabilities\. Your agent remains the center of the system\.<\/text>\s*<g\b[^>]*id="standalone-forge"/);
  assert.equal([...svg.matchAll(/<text\b[^>]*>OPTIONAL CONNECTION<\/text>/g)].length, 4);
  const connections = svg.match(/<g\b[^>]*id="harness-connections"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  assert.ok(connections, 'The harness needs an explicit group of optional connections');
  assert.equal([...connections.matchAll(/<path\b/g)].length, 4);
  const forge = svg.match(/<g\b[^>]*id="standalone-forge"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  assert.match(forge ?? '', /No agent needed to start/);
  assert.doesNotMatch(forge, /<path\b/);
});

test('setup skill covers exactly the published implementations at the reviewed pins', () => {
  const skill = read('.agents/skills/soulsteads-setup/SKILL.md');
  const pins = [...skill.matchAll(/\| `https:\/\/github.com\/soulsteads\/([\w-]+)\.git` \/ `main` \| `([a-f0-9]{40})`/g)].map(([, repo, sha]) => `${repo}:${sha}`);
  assert.deepEqual(pins.sort(), catalog.products.filter(p => p.published.implementation).map(p => `${p.published.repo}:${p.published.commit}`).sort());
  for (const name of ['soulsteads-setup', 'soulsteads-connect']) {
    assert.match(read(`.agents/skills/${name}/SKILL.md`), new RegExp(`^---\\nname: ${name}\\ndescription: .{1,60}\\n---\\n`));
  }
});

test('Messaging working directory is not treated as Home translation or a history migration', () => {
  const skill = read('.agents/skills/soulsteads-connect/SKILL.md').split('### Agent/host → Agent Workboard')[0];
  assert.match(skill, /`acp\.backends\.soulsteads`/);
  assert.match(skill, /`soulsteads run <home> -- acp`/);
  assert.match(skill, /`<home>\/workspace`[^.]*not the canonical Home root/);
  assert.match(skill, /Do not use `\/clear` or `\/reset`[^.]*\. They delete current session history[^.]*explicit approval/);
  assert.match(html, /working directory, not an Agent Home import/);
  assert.match(readme, /working directory, not an Agent Home import/);
});

test('Start here stories render from shared metadata before the release catalog', () => {
  const journeys = catalog.journeys;
  assert.ok(Array.isArray(journeys), 'journeys must come from the common lineup metadata');
  assert.deepEqual(journeys.map(({ id }) => id), [
    'workboard-sqlite', 'messaging-chat', 'forge-postgres', 'home-hermes-import',
  ]);
  assert.deepEqual(journeys.map(({ source }) => source), ['tagged', 'tagged', 'preview', 'preview']);
  assert.ok(readme.indexOf('<!-- readme-start-here -->') < readme.indexOf('<!-- readme-lineup -->'));
  assert.ok(html.indexOf('id="start-here"') < html.indexOf('id="lineup-title"'));
  const sectionStart = html.indexOf('id="start-here"');
  const sectionClose = html.indexOf('</section>', sectionStart);
  const journeySection = sectionStart < 0 || sectionClose < 0 ? '' : html.slice(sectionStart, sectionClose + '</section>'.length);
  assert.ok(journeySection, 'website must render a Start here section');
  assert.equal(journeySection.includes('<pre'), false, 'setup commands stay in component guides');
  assert.doesNotMatch(journeySection, /git clone|pip install/i, 'journey cards must not repeat commands');
  for (const { title } of journeys) {
    assert.ok(readme.includes(title), `README is missing ${title}`);
    assert.ok(html.includes(title), `website is missing ${title}`);
  }
  const copy = journeys.map(({ title, summary, guides }) => [title, summary, ...guides.map(guide => guide.label)].join('\n')).join('\n');
  assert.match(copy, /SQLite/i);
  assert.match(copy, /no model/i);
  assert.match(copy, /Telegram/i);
  assert.match(copy, /existing .*harness/i);
  assert.match(copy, /PostgreSQL/i);
  assert.match(copy, /Hermes import in read-only/i);
  assert.match(readme, /tagged source/i);
  assert.match(readme, /source preview/i);
  assert.match(readme, /build from source, not download a binary/i);
  assert.doesNotMatch(copy, /Agent Harness|Agent Voice/);
});

test('Start here offers current website chat guides and version-matched README guides', () => {
  const section = html.match(/<section\b[^>]*id="start-here"[\s\S]*?<\/section>/)[0];
  const card = section.match(/<article\b[^>]*data-journey="messaging-[^"]+"[\s\S]*?<\/article>/)[0];
  const markdown = readme.split('<!-- readme-start-here -->')[1].split('<!-- end-readme-start-here -->')[0];
  const repo = 'https://github.com/soulsteads/soulsteads-agent-messaging/blob/';
  for (const path of ['SETUP.md#telegram', 'MATTERMOST.md', 'MATRIX.md']) {
    assert.ok(card.includes(`${repo}main/docs/${path}`), `Website Start here needs ${path}`);
    assert.ok(markdown.includes(`${repo}v0.2.0/docs/${path}`), `README Start here needs ${path}`);
  }
  const options = [
    ['Telegram', 'Guided setup on Linux for Claude Code or Codex.'],
    ['Mattermost', 'Manual Linux setup with a dedicated bot.'],
    ['Matrix', 'Manual Linux setup in an unencrypted room.'],
  ];
  for (const [name, note] of options) {
    const rows = [...card.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(([, body]) => body);
    assert.ok(rows.some(row => row.includes(`${name} setup`) && row.includes(note)), `${name} needs its own website setup row`);
    assert.ok(markdown.split('\n').some(line => line.startsWith(`- [${name} setup](`) && line.endsWith(note)), `${name} needs its own README setup bullet`);
  }
  assert.doesNotMatch(section, /\b[a-f0-9]{40}\b(?!\/)/, 'Commit pins belong in setup link destinations, not display copy');
  assert.doesNotMatch(markdown, /\b[a-f0-9]{40}\b(?!\/)/, 'Commit pins belong in setup link destinations, not display copy');
});

test('the documented reviewed-source recipe pins a detached checkout and fails closed', () => {
  const skill = read('.agents/skills/soulsteads-setup/SKILL.md');
  const documented = skill.match(/```sh\n# reviewed-checkout-recipe\n([\s\S]*?)```/);
  assert.ok(documented, 'setup skill must contain the tested reviewed-checkout recipe');
  const recipe = documented[1];
  const scratch = process.env.TMPDIR || tmpdir();
  mkdirSync(scratch, { recursive: true });
  const root = mkdtempSync(join(scratch, 'soulsteads-onboarding-'));
  const runGit = (cwd, ...args) => {
    const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const runRecipe = (destination, reviewedSha, guide = 'README.md') => spawnSync(
    'bash', ['-eu', '-c', recipe],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        REPOSITORY: join(root, 'source repo'),
        REVIEWED_REF: 'refs/tags/reviewed-v1',
        REVIEWED_SHA: reviewedSha,
        GUIDE: guide,
        DESTINATION: destination,
      },
    },
  );

  try {
    const source = join(root, 'source repo');
    const nestedGuide = 'docs/nested/quickstart.md';
    mkdirSync(join(source, 'docs', 'nested'), { recursive: true });
    runGit(source, 'init', '--initial-branch=main');
    runGit(source, 'config', 'user.name', 'Soulsteads onboarding test');
    runGit(source, 'config', 'user.email', 'onboarding@example.invalid');
    writeFileSync(join(source, 'README.md'), '# Reviewed quickstart\n\nKnown guide at the reviewed pin.\n');
    writeFileSync(join(source, nestedGuide), '# Nested reviewed guide\n');
    symlinkSync('nested/quickstart.md', join(source, 'docs', 'leaf-link.md'));
    symlinkSync('nested', join(source, 'docs', 'directory-link'));
    runGit(source, 'add', 'README.md', 'docs');
    runGit(source, 'commit', '-m', 'reviewed guide');
    const submoduleCommit = runGit(source, 'rev-parse', 'HEAD');
    runGit(source, 'update-index', '--add', '--cacheinfo', `160000,${submoduleCommit},docs/fake-submodule`);
    runGit(source, 'commit', '-m', 'add synthetic gitlink');
    const reviewedSha = runGit(source, 'rev-parse', 'HEAD');
    runGit(source, 'tag', 'reviewed-v1');
    writeFileSync(join(source, 'docs', 'untracked.md'), '# Synthetic untracked guide\n');
    writeFileSync(join(source, 'README.md'), '# Newer main\n\nThis must not replace the reviewed guide.\n');
    runGit(source, 'add', 'README.md');
    runGit(source, 'commit', '-m', 'newer main guide');
    const newerMainSha = runGit(source, 'rev-parse', 'HEAD');
    assert.notEqual(reviewedSha, newerMainSha, 'the reviewed tag must be behind main');

    const destination = join(root, 'fresh checkout with spaces');
    const success = runRecipe(destination, reviewedSha, nestedGuide);
    assert.equal(success.status, 0, success.stderr);
    assert.equal(runGit(destination, 'rev-parse', 'HEAD'), reviewedSha);
    assert.equal(spawnSync('git', ['-C', destination, 'symbolic-ref', '-q', 'HEAD']).status, 1,
      'successful checkout must be detached');
    assert.match(readFileSync(join(destination, nestedGuide), 'utf8'), /Nested reviewed guide/);
    assert.match(readFileSync(join(destination, 'README.md'), 'utf8'), /Known guide at the reviewed pin/);
    assert.doesNotMatch(readFileSync(join(destination, 'README.md'), 'utf8'), /Newer main/);

    const wrongPin = join(root, 'wrong pin');
    const wrongPinResult = runRecipe(wrongPin, newerMainSha);
    assert.notEqual(wrongPinResult.status, 0, 'a mismatched expected SHA must fail');
    assert.equal(existsSync(wrongPin), false, 'a wrong pin must not fall forward to main');

    const missingGuide = join(root, 'missing guide');
    const missingGuideResult = runRecipe(missingGuide, reviewedSha, 'docs/missing-guide.md');
    assert.notEqual(missingGuideResult.status, 0, 'a missing guide must fail');
    assert.equal(existsSync(missingGuide), false, 'a missing guide must not publish a checkout');

    const outsideGuide = join(root, 'synthetic outside guide.md');
    writeFileSync(outsideGuide, '# Synthetic fixture outside the checkout\n');
    const refusedGuides = [
      ['', 'empty path'],
      [outsideGuide, 'absolute path'],
      ['.', 'dot component'],
      [`./${nestedGuide}`, 'leading dot component'],
      ['docs/../README.md', 'parent traversal'],
      ['docs//nested/quickstart.md', 'empty component'],
      ['docs/nested', 'tree entry'],
      ['docs/fake-submodule', 'gitlink entry'],
      ['docs/untracked.md', 'untracked filesystem entry'],
      ['docs/leaf-link.md', 'symlink leaf'],
      ['docs/directory-link/quickstart.md', 'symlink ancestor'],
    ];
    for (const [index, [guide, reason]] of refusedGuides.entries()) {
      const rejectedDestination = join(root, `refused guide ${index}`);
      const rejected = runRecipe(rejectedDestination, reviewedSha, guide);
      assert.notEqual(rejected.status, 0, `${reason} must be refused`);
      assert.equal(existsSync(rejectedDestination), false, `${reason} must not publish a checkout`);
    }

    const userCheckout = join(root, 'existing user checkout');
    mkdirSync(userCheckout);
    runGit(userCheckout, 'init', '--initial-branch=main');
    runGit(userCheckout, 'config', 'user.name', 'User');
    runGit(userCheckout, 'config', 'user.email', 'user@example.invalid');
    writeFileSync(join(userCheckout, 'README.md'), 'user committed work\n');
    runGit(userCheckout, 'add', 'README.md');
    runGit(userCheckout, 'commit', '-m', 'user work');
    const userHead = runGit(userCheckout, 'rev-parse', 'HEAD');
    writeFileSync(join(userCheckout, 'README.md'), 'user uncommitted work\n');
    const userStatus = runGit(userCheckout, 'status', '--porcelain');
    const existingResult = runRecipe(userCheckout, reviewedSha);
    assert.notEqual(existingResult.status, 0, 'an existing destination must be refused');
    assert.equal(runGit(userCheckout, 'rev-parse', 'HEAD'), userHead);
    assert.equal(readFileSync(join(userCheckout, 'README.md'), 'utf8'), 'user uncommitted work\n');
    assert.equal(runGit(userCheckout, 'status', '--porcelain'), userStatus);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
