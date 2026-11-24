import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { renderInstaller } from '../scripts/render-lineup.mjs';

const script = fileURLToPath(new URL('../install.sh', import.meta.url));
const catalog = JSON.parse(readFileSync(new URL('../data/products.json', import.meta.url), 'utf8'));

function scratch(t, parent = tmpdir()) {
  const dir = mkdtempSync(join(parent, 'soulsteads-installer-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function run(path, args, env) {
  const result = spawnSync('bash', [path, ...args], { env, encoding: 'utf8', timeout: 10_000 });
  assert.ifError(result.error);
  return result;
}

test('lists the installer products and previews their pinned releases offline', (t) => {
  const dir = scratch(t);
  const env = { HOME: join(dir, 'not created'), PATH: process.env.PATH, TMPDIR: dir };
  const available = run(script, ['--list'], env);
  assert.equal(available.status, 0, available.stderr);
  assert.deepEqual(available.stdout.trim().split('\n').map(line => line.split(/\s+/)[0]), catalog.lineup);
  for (const p of catalog.products.filter(p => p.published.releaseTag)) {
    const preview = run(script, ['--dry-run', p.slug], env);
    assert.equal(preview.status, 0, preview.stderr);
    const prefix = `${catalog.organization}/${p.published.repo}/releases/download/${p.published.releaseTag}/`;
    assert.ok(p.published.assets.filter(a => a !== 'SHA256SUMS').some(a => preview.stdout.includes(prefix + a)));
    assert.ok(preview.stdout.includes(`SHA-256: ${p.published.installer.sha256}`));
    assert.ok(preview.stdout.includes(`Commands: ${p.published.installer.commands.join(' ')}`));
    assert.ok(preview.stdout.includes(join(env.HOME, '.local', 'bin')));
    assert.ok(preview.stdout.includes(`${catalog.organization}/${p.published.repo}/blob/${p.published.releaseTag}/${p.taggedSetup.guide}`));
  }
  assert.equal(existsSync(env.HOME), false);
});

test('rejects invalid selections before trying an install', (t) => {
  const dir = scratch(t);
  const env = { HOME: join(dir, 'not created'), PATH: process.env.PATH, TMPDIR: dir };
  for (const args of [['all'], ['agent-home', 'agent-workboard'], ['--force', 'agent-home'], ['--dry-run']]) {
    const result = run(script, args, env);
    assert.notEqual(result.status, 0, args.join(' '));
    assert.match(result.stderr, /install\.sh:/);
  }
  assert.equal(existsSync(env.HOME), false);
});

test('installer pins are generated and reject unsafe or unpublished assets', () => {
  const source = readFileSync(script, 'utf8');
  assert.equal(renderInstaller(catalog, source), source);
  const changed = structuredClone(catalog);
  const [p] = changed.products;
  p.published.installer.asset = 'not-a-release-asset.whl';
  assert.throws(() => renderInstaller(changed, source), /Invalid installer metadata for agent-home/);
  p.published.installer.asset = p.published.assets[1];
  p.published.installer.commands = ["bad'command"];
  assert.throws(() => renderInstaller(changed, source), /Invalid installer metadata for agent-home/);
});

function fixture(t, wheel = false) {
  const dir = scratch(t, realpathSync(process.env.RUNNER_TEMP || process.env.TMPDIR || homedir()));
  const env = { HOME: join(dir, 'home with spaces'), TMPDIR: join(dir, 'temp'), LOG: join(dir, 'calls') };
  const stubs = join(dir, 'stubs');
  for (const path of [env.HOME, env.TMPDIR, stubs]) mkdirSync(path);
  env.PATH = `${stubs}:${process.env.PATH}`;
  const slug = wheel ? 'agent-home' : 'agent-workboard';
  const product = catalog.products.find(p => p.slug === slug);
  const asset = product.published.assets.find(a => a !== 'SHA256SUMS');
  const executable = wheel ? 'soulsteads' : 'soulsteads-workboard';
  const bin = join(env.HOME, '.local', 'bin');
  env.PAYLOAD = join(dir, asset);
  const scriptBytes = '#!/bin/sh\nprintf "fixture\\n"\n';
  if (wheel) {
    writeFileSync(env.PAYLOAD, 'wheel fixture');
  } else {
    const archiveDir = asset.slice(0, -7);
    mkdirSync(join(dir, archiveDir));
    writeFileSync(join(dir, archiveDir, executable), scriptBytes);
    const tar = spawnSync('tar', ['-czf', env.PAYLOAD, '-C', dir, archiveDir], { encoding: 'utf8' });
    assert.equal(tar.status, 0, tar.stderr);
  }
  const digest = createHash('sha256').update(readFileSync(env.PAYLOAD)).digest('hex');
  const copy = join(dir, 'installer.sh');
  // Bind a synthetic asset without adding a production URL or checksum override.
  const source = readFileSync(script, 'utf8');
  assert.match(source, new RegExp(`^${slug}\\|.*\\|[0-9a-f]{64}\\|`, 'm'));
  writeFileSync(copy, source.replace(new RegExp(`^${slug}\\|.*$`, 'm'), row => row.replace(/[0-9a-f]{64}/, digest)));
  const stub = (name, content) => writeFileSync(join(stubs, name), `#!/bin/sh\nset -eu\n${content}\n`, { mode: 0o755 });
  stub('curl', `out=\nfor arg do\n  if [ "\${prev:-}" = --output ]; then out=$arg; fi\n  prev=$arg\ndone\nprintf 'curl %s\\n' "$prev" >> "$LOG"\ncp "$PAYLOAD" "$out"`);
  stub('uname', 'case "$1" in -s) printf "Linux\\n";; -m) printf "x86_64\\n";; *) exit 2;; esac');
  stub('getconf', 'test "$1" = GNU_LIBC_VERSION; printf "glibc 2.39\\n"');
  stub('uv', `if [ "$2" = dir ]; then printf '%s\\n' "$HOME/tools"; exit; fi
printf 'uv %s\\n' "$*" >> "$LOG"
for last do :; done
printf '%s\\n' "$UV_TOOL_BIN_DIR" >> "$LOG"
cmp "$PAYLOAD" "$last"
tool="$HOME/tools/soulsteads/bin/soulsteads"
if [ ! -x "$tool" ]; then
  mkdir -p "\${tool%/*}" "$UV_TOOL_BIN_DIR"
  printf '#!/bin/sh\\n' > "$tool"
  chmod +x "$tool"
  ln -s "$tool" "$UV_TOOL_BIN_DIR/soulsteads"
fi`);
  return { dir, env, copy, slug, bin, dest: join(bin, executable), asset, scriptBytes, stub };
}

test('a mismatched digest stops before publishing or invoking uv', (t) => {
  for (const wheel of [false, true]) {
    const { env, copy, slug } = fixture(t, wheel);
    writeFileSync(env.PAYLOAD, 'not the expected bytes');
    const result = run(copy, [slug], env);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHA-256 mismatch/);
    assert.match(readFileSync(env.LOG, 'utf8'), /^curl https:\/\/github\.com\/soulsteads\/[^\n]+\n$/);
    assert.deepEqual(readdirSync(env.HOME), []);
    assert.deepEqual(readdirSync(env.TMPDIR), []);
  }
});

test('publishes a verified native binary without clobbering an existing entry', (t) => {
  const { env, copy, slug, bin, dest, scriptBytes } = fixture(t);
  const installed = run(copy, [slug], env);
  assert.equal(installed.status, 0, installed.stderr);
  assert.equal(readFileSync(dest, 'utf8'), scriptBytes);
  assert.equal(statSync(bin).mode & 0o777, 0o700);
  assert.equal(spawnSync(dest, { encoding: 'utf8' }).stdout, 'fixture\n');
  assert.equal(run(copy, [slug], env).status, 0);
  rmSync(dest);
  const foreign = join(env.HOME, 'keep me');
  writeFileSync(foreign, 'keep me');
  symlinkSync(foreign, dest);
  const refused = run(copy, [slug], env);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /Refusing to overwrite/);
  assert.equal(readFileSync(foreign, 'utf8'), 'keep me');
});

test('hands uv a persistent verified wheel and the selected bin directory', (t) => {
  const { env, copy, slug, asset } = fixture(t, true);
  env.SOULSTEADS_BIN_DIR = join(env.HOME, 'my bin');
  const result = run(copy, [slug], env);
  assert.equal(result.status, 0, result.stderr);
  const wheel = join(env.HOME, '.local', 'share', 'soulsteads', 'wheels', asset);
  assert.equal(readFileSync(wheel, 'utf8'), 'wheel fixture');
  const log = readFileSync(env.LOG, 'utf8');
  assert.match(log, /uv tool install .*--no-python-downloads/);
  assert.ok(log.includes(` ${wheel}\n${env.SOULSTEADS_BIN_DIR}\n`));
  assert.deepEqual(readdirSync(env.TMPDIR), []);
});

test('does not report a Python install in a new bin directory when uv kept its prior links', (t) => {
  const { env, copy, slug, dest } = fixture(t, true);
  const first = run(copy, [slug], env);
  assert.equal(first.status, 0, first.stderr);
  assert.ok(existsSync(dest));
  env.SOULSTEADS_BIN_DIR = join(env.HOME, 'other bin');
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /uv did not put/);
  assert.doesNotMatch(result.stdout, /Installed/);
  assert.ok(existsSync(dest));
});

test('refuses an unrelated command in the Python bin directory before tool install', (t) => {
  const { env, copy, slug, bin, dest } = fixture(t, true);
  mkdirSync(bin, { recursive: true });
  writeFileSync(dest, 'keep this command', { mode: 0o755 });
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Refusing to overwrite/);
  assert.doesNotMatch(readFileSync(env.LOG, 'utf8'), /^uv tool install/m);
  assert.equal(readFileSync(dest, 'utf8'), 'keep this command');
});

test('rejects an unsupported native platform before contacting GitHub', (t) => {
  const { env, copy, slug, stub } = fixture(t);
  stub('uname', 'case "$1" in -s) printf "Linux\\n";; -m) printf "aarch64\\n";; esac');
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Linux x86-64/);
  assert.match(result.stderr, /Setup guide:/);
  assert.equal(existsSync(env.LOG), false);
});

test('rejects glibc older than the selected binary requires before downloading', (t) => {
  const { env, copy, slug, stub } = fixture(t);
  stub('getconf', 'test "$1" = GNU_LIBC_VERSION; printf "glibc 2.33\\n"');
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /glibc 2\.34 or newer/);
  assert.match(result.stderr, /Setup guide:/);
  assert.equal(existsSync(env.LOG), false);
});

for (const [variable, wheel] of [['SOULSTEADS_BIN_DIR', false], ['XDG_DATA_HOME', true]]) {
  test(`refuses shared directories and symlink components in ${variable}`, (t) => {
    const { dir, env, copy, slug } = fixture(t, wheel);
    const target = join(dir, 'target');
    const alias = join(dir, 'alias');
    mkdirSync(target);
    writeFileSync(join(target, 'sentinel'), 'unchanged');
    symlinkSync(target, alias);
    for (const [path, mode] of [[target, 0o777], [join(target, 'absent'), 0o775],
      [alias, 0o700], [join(alias, 'absent'), 0o700]]) {
      chmodSync(target, mode);
      env[variable] = path;
      const result = run(copy, [slug], env);
      assert.notEqual(result.status, 0, path);
      assert.match(result.stderr, /Unsafe install directory/);
      assert.equal(existsSync(env.LOG), false, 'reject before download or uv install');
      assert.deepEqual(readdirSync(target), ['sentinel']);
      assert.equal(readFileSync(join(target, 'sentinel'), 'utf8'), 'unchanged');
    }
  });
}

test('refuses a download staging directory writable by other users', (t) => {
  const { env, copy, slug } = fixture(t);
  chmodSync(env.TMPDIR, 0o777);
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe temporary directory/);
  assert.equal(existsSync(env.LOG), false);
  assert.deepEqual(readdirSync(env.TMPDIR), []);
});

test('checks the native bin directory again after download', (t) => {
  const { dir, env, bin, copy, slug, stub } = fixture(t);
  mkdirSync(bin, { recursive: true });
  env.BIN = bin;
  env.OTHER = join(dir, 'other');
  mkdirSync(env.OTHER);
  stub('curl', `out=\nfor arg do\n  if [ "\${prev:-}" = --output ]; then out=$arg; fi\n  prev=$arg\ndone\ncp "$PAYLOAD" "$out"\nmv "$BIN" "$BIN.original"\nln -s "$OTHER" "$BIN"`);
  const result = run(copy, [slug], env);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe install directory/);
  assert.deepEqual(readdirSync(env.OTHER), []);
  assert.deepEqual(readdirSync(`${bin}.original`), []);
});
