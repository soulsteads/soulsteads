import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillPath = fileURLToPath(new URL('../skills/soulsteads-setup/SKILL.md', import.meta.url));
const skill = readFileSync(skillPath, 'utf8');
const recipe = skill.match(/```sh\n# reviewed-checkout-recipe\n([\s\S]*?)\n```/)?.[1];

function commandPath(name) {
  const result = spawnSync('sh', ['-c', 'command -v "$1"', 'sh', name], { encoding: 'utf8' });
  assert.equal(result.status, 0, `could not locate ${name}`);
  return result.stdout.trim();
}

function writeExecutable(path, contents) {
  writeFileSync(path, contents, { mode: 0o755 });
  chmodSync(path, 0o755);
}

test('the extracted checkout recipe refuses a destination created at publication', () => {
  assert.ok(recipe, 'reviewed checkout recipe exists in the setup skill');

  const root = mkdtempSync(join(tmpdir(), 'reviewed-checkout-race-'));
  const bin = join(root, 'bin');
  const destination = join(root, 'checkout');
  const marker = join(root, 'late-destination-created');
  mkdirSync(bin);

  const gitStub = `#!/bin/sh
set -eu
[ "$1" = -C ]
repository=$2
shift 2
command=$1
shift
case "$command" in
  init) mkdir -p "$repository/.git" ;;
  remote) : ;;
  fetch) printf '%s\\n' "$REVIEWED_SHA" > "$repository/fetched-commit" ;;
  rev-parse) cat "$repository/fetched-commit" ;;
  ls-tree) printf '100644 blob 0000000000000000000000000000000000000000\\t%s\\0' "$GUIDE" ;;
  checkout)
    case "\${MATERIALIZE_SYMLINK:-}" in
      leaf)
        printf 'benign target\\n' > "$repository/target"
        ln -s target "$repository/$GUIDE"
        ;;
      ancestor)
        mkdir -p "$repository/docs" "$repository/target"
        printf 'benign target\\n' > "$repository/target/quickstart.md"
        ln -s ../target "$repository/docs/link"
        ;;
      *) printf 'reviewed guide\\n' > "$repository/$GUIDE" ;;
    esac
    ;;
  *) printf 'unexpected git command: %s\\n' "$command" >&2; exit 90 ;;
esac
`;
  const inject = `if [ ! -e "$INJECTION_MARKER" ]; then
  mkdir "$DESTINATION"
  printf 'late occupant\\n' > "$DESTINATION/owner.txt"
  : > "$INJECTION_MARKER"
fi`;
  const mvStub = `#!/bin/sh
set -eu
${inject}
exec "$REAL_MV" "$@"
`;
  const pythonStub = `#!/bin/sh
set -eu
case "$*" in
  *renameat2*)
    ${inject}
    ;;
esac
exec "$REAL_PYTHON" "$@"
`;

  try {
    writeExecutable(join(bin, 'git'), gitStub);
    writeExecutable(join(bin, 'mv'), mvStub);
    writeExecutable(join(bin, 'python3'), pythonStub);

    const result = spawnSync('/bin/sh', ['-c', recipe], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        REPOSITORY: 'https://example.invalid/repo.git',
        REVIEWED_REF: 'refs/tags/reviewed-test',
        REVIEWED_SHA: 'a'.repeat(40),
        GUIDE: 'README.md',
        DESTINATION: destination,
        INJECTION_MARKER: marker,
        REAL_MV: commandPath('mv'),
        REAL_PYTHON: commandPath('python3'),
      },
    });

    assert.notEqual(result.status, 0, `recipe unexpectedly succeeded:\n${result.stdout}\n${result.stderr}`);
    assert.ok(existsSync(marker), 'race hook injected the late destination');
    assert.doesNotMatch(result.stdout, /Reviewed guide:/, 'recipe did not report successful publication');
    assert.equal(readFileSync(join(destination, 'owner.txt'), 'utf8'), 'late occupant\n');
    assert.deepEqual(readdirSync(destination), ['owner.txt'], 'recipe did not nest the staged checkout');
    assert.deepEqual(
      readdirSync(root).filter((entry) => entry.startsWith(`${basename(destination)}.tmp.`)),
      [],
      'failed publication cleaned up its private staging directory',
    );

    for (const [mode, guide] of [['leaf', 'README.md'], ['ancestor', 'docs/link/quickstart.md']]) {
      const symlinkDestination = join(root, `symlink-${mode}-checkout`);
      const symlinkMarker = join(root, `symlink-${mode}-injection`);
      const symlinkResult = spawnSync('/bin/sh', ['-c', recipe], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          REPOSITORY: 'https://example.invalid/repo.git',
          REVIEWED_REF: 'refs/tags/reviewed-test',
          REVIEWED_SHA: 'a'.repeat(40),
          GUIDE: guide,
          DESTINATION: symlinkDestination,
          INJECTION_MARKER: symlinkMarker,
          REAL_MV: commandPath('mv'),
          REAL_PYTHON: commandPath('python3'),
          MATERIALIZE_SYMLINK: mode,
        },
      });
      assert.notEqual(symlinkResult.status, 0, `materialized ${mode} symlink must be refused`);
      assert.equal(existsSync(symlinkDestination), false, `${mode} symlink must not publish a checkout`);
      assert.equal(existsSync(symlinkMarker), false, `${mode} symlink must be rejected before publication`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
